import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";
import { FormDataEncoder } from "form-data-encoder";
import { Readable } from "stream";
import getMongoDb from "@/lib/mongo";
import { ObjectId } from "mongodb";

// Disable body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const db = await getMongoDb();
    const filesCollection = db.collection("files");
    const gcpCollection = db.collection("gcps");
    const gcpsInImagesCollection = db.collection("gcps_in_images");

    // Find all images in the project
    const imageFiles = await filesCollection.find({ project_id: id, file_type: "image" }).toArray();
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(404).json({ error: "No images found for project" });
    }

    // Fetch GCPs for the project
    const gcps = await gcpCollection.find({ projectId: id }).toArray();
    if (!gcps || gcps.length === 0) {
      return res.status(404).json({ error: "No GCPs found for project" });
    }

    // Create a mapping from GCP name to GCP ID
    const gcpIdMap = gcps.reduce((map, gcp) => {
      map[gcp.name] = gcp._id; // Store MongoDB ObjectId for each GCP
      return map;
    }, {} as Record<string, ObjectId>);

    // Construct `gcp_list` and `crs`
    const crs = gcps[0].coordinateSystem;
    const gcpList = gcps.map((gcp) => [gcp.name, gcp.lat, gcp.lng, gcp.altitude]);

    const baseUploadDir = process.env.LOCAL_STORAGE_URL || "/home/duxmazter/droneweb/uploads";
    const projectDir = path.join(baseUploadDir, "projects", id);
    const flaskUrl = process.env.FLASK_GCP_URL;

    if (!flaskUrl) {
      console.error("[GCP DETECTION] FLASK_GCP_URL not set in env");
      return res.status(500).json({ error: "Flask URL not configured" });
    }

    const uploadedImages: { file_name: string; image_uuid: string }[] = [];

    console.log(`[GCP DETECTION] Found ${imageFiles.length} images for project: ${id}`);

    // Step 1: Upload images to Flask
    for (const imageFile of imageFiles) {
      const imagePath = path.join(projectDir, imageFile.file_name);
      console.log("[GCP DETECTION] Uploading image:", imagePath);

      if (!fs.existsSync(imagePath)) {
        console.error("[GCP DETECTION] Image not found:", imagePath);
        continue;
      }

      // Prepare FormData
      const formData = new FormData();
      const file = await fileFromPath(imagePath);
      formData.append("file", file, imageFile.file_name);

      // Create headers using form-data-encoder
      const encoder = new FormDataEncoder(formData);

      console.log("[GCP DETECTION] Sending image to Flask AutoGCP:", `${flaskUrl}/upload`);

      // Upload image to Flask AutoGCP
      const flaskResponse = await fetch(`${flaskUrl}/upload`, {
        method: "POST",
        headers: { ...encoder.headers },
        body: Readable.from(encoder),
      });

      const responseText = await flaskResponse.text();
      console.log("[GCP DETECTION] Flask Response:", flaskResponse.status, responseText);

      if (!flaskResponse.ok) {
        console.error("[GCP DETECTION] Failed to upload:", imageFile.file_name);
        continue;
      }

      // Parse response from Flask
      const flaskData = JSON.parse(responseText);
      if (flaskData.image_uuid) {
        uploadedImages.push({ file_name: imageFile.file_name, image_uuid: flaskData.image_uuid });
      }
    }

    console.log(`[GCP DETECTION] Successfully uploaded ${uploadedImages.length} images`);
    console.log("[GCP DETECTION] Waiting for 5 seconds before running inference...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    interface GcpPrediction {
      filename: string;
      gcps: Record<string, { x: number; y: number }>;
    }

    const predictionResults: { file_name: string; image_uuid: string; prediction: GcpPrediction }[] = [];

    for (const img of uploadedImages) {
      console.log(`[GCP DETECTION] Preparing prediction request for image: ${img.image_uuid}`);

      const requestBody = { crs, gcp_list: gcpList };
      console.log("[GCP DETECTION] Request Body:", JSON.stringify(requestBody, null, 2));

      const predictResponse = await fetch(`${flaskUrl}/predict/${img.image_uuid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const predictResponseText = await predictResponse.text();
      console.log("[GCP DETECTION] RAW Flask Prediction Response:", predictResponseText);
      console.log("[GCP DETECTION] Flask Prediction Response Status:", predictResponse.status);

      if (!predictResponse.ok) {
        console.error("[GCP DETECTION] Prediction failed for:", img.file_name);
        continue;
      }

      const predictData: GcpPrediction = JSON.parse(predictResponseText);
      predictionResults.push({
        file_name: img.file_name,
        image_uuid: img.image_uuid,
        prediction: predictData,
      });

      // Insert detected GCPs into `gcps_in_images`
      const detectedGcps = Object.entries(predictData.gcps);
      if (detectedGcps.length > 0) {
        console.log(`[GCP DETECTION] Storing detected GCPs for image: ${img.file_name}`);

        const insertOperations = detectedGcps.map(([gcpName, { x, y }]) => {
          if (!gcpIdMap[gcpName]) {
            console.warn(`[GCP DETECTION] Skipping unknown GCP: ${gcpName}`);
            return null;
          }
          return {
            project_id: id,
            file_id: img.file_name,
            file_name: img.file_name,
            gcp_id: gcpIdMap[gcpName],
            x,
            y,
            created_at: new Date(),
            updated_at: new Date(),
          };
        }).filter(Boolean); // Remove null values

        if (insertOperations.length > 0) {
          await gcpsInImagesCollection.insertMany(insertOperations.filter(op => op !== null));
          console.log(`[GCP DETECTION] Inserted ${insertOperations.length} GCPs into gcps_in_images`);
        }
      }
    }

    console.log(`[GCP DETECTION] Completed predictions for ${predictionResults.length} images`);

    return res.status(200).json({
      message: "GCP detection completed and saved to MongoDB",
      predictions: predictionResults,
    });

  } catch (error) {
    console.error("[GCP DETECTION] Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
