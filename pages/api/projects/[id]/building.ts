import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";
import getMongoDb from "@/lib/mongo";
import { FormDataEncoder } from "form-data-encoder";
import { Readable } from "stream";


// Disable body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }
  
  const baseUploadDir = process.env.LOCAL_STORAGE_URL || "/home/duxmazter/droneweb/uploads";
  const buildingDir = path.join(baseUploadDir, "projects", id, "building");

  try {
    const db = await getMongoDb();
    const filesCollection = db.collection("files");

    if (req.method === "GET") {
      // Check if building footprint exists in MongoDB
      const buildingExists = await filesCollection.findOne({
        project_id: id,
        file_name: "building/geo_polygon_definitions.json",
      });

      if (buildingExists) {
        return res.status(200).json({ status: "exists", message: "Building footprint exists" });
      } else {
        return res.status(404).json({ status: "not_found", message: "Building footprint does not exist" });
      }
    }

    else if (req.method === "POST") {
      console.log("[BUILDING] POST endpoint called for project:", id);
    
      // Check if building footprint already exists
      const buildingExists = await filesCollection.findOne({
        project_id: id,
        file_name: "building/geo_polygon_definitions.json",
      });
      console.log("[BUILDING] Checking if building footprint already exists:", buildingExists);
    
      if (buildingExists) {
        console.log("[BUILDING] Footprint already exists, returning 409.");
        return res.status(409).json({
          error: "Building already exists. Delete it first before creating a new one.",
        });
      }
    
      // Determine project directory and orthophoto file path.
      const baseUploadDir = process.env.LOCAL_STORAGE_URL || "/home/duxmazter/droneweb/uploads";
      const projectDir = path.join(baseUploadDir, "projects", id);
      const orthophotoPath = path.join(projectDir, "odm_orthophoto", "odm_orthophoto.tif");
    
      console.log("[BUILDING] Checking orthophoto at:", orthophotoPath);
      if (!fs.existsSync(orthophotoPath)) {
        console.log("[BUILDING] Orthophoto not found at path:", orthophotoPath);
        return res.status(400).json({ error: "Orthophoto file not found" });
      }
      console.log("[BUILDING] Orthophoto found at path:", orthophotoPath);
    
      try {
        // Create WHATWG-compliant FormData using formdata-node.
        console.log("[BUILDING] Creating formData from path:", orthophotoPath);
        const formData = new FormData();
        const file = await fileFromPath(orthophotoPath);
        formData.append("file", file, path.basename(orthophotoPath));
    
        // Get the Flask URL from environment variables.
        const flaskUrl = "process.env.FLASK_BUILDING_URL";
        if (!flaskUrl) {
          console.error("[BUILDING] FLASK_BUILDING_URL not defined in environment variables");
          return res.status(500).json({ error: "Flask endpoint not configured" });
        }
    
        // Use form-data-encoder to create the proper headers and body stream.
        const encoder = new FormDataEncoder(formData);
    
        console.log("[BUILDING] Sending POST to Flask app at:", `${flaskUrl}/upload`);
        const flaskResponse = await fetch(`${flaskUrl}/upload`, {
          method: "POST",
          headers: {
            ...encoder.headers,
          },
          body: Readable.from(encoder),
        });
        console.log("[BUILDING] Flask response status:", flaskResponse.status, flaskResponse.statusText);
    
        if (!flaskResponse.ok) {
          const errorText = await flaskResponse.text();
          console.log("[BUILDING] Flask error response body:", errorText);
          return res.status(500).json({ error: "Failed to upload orthophoto to Flask app" });
        }
    
        const flaskData = await flaskResponse.json();
        console.log("[BUILDING] Flask JSON data:", flaskData);
        const taskUuid = flaskData.task_id;
        if (!taskUuid) {
          console.log("[BUILDING] No task ID returned from Flask app!");
          return res.status(500).json({ error: "No task ID returned from Flask app" });
        }
        console.log("[BUILDING] Received taskUuid from Flask:", taskUuid);
    
        // Poll the Flask status endpoint periodically.
        let completed = false;
        let finalOutput = null;
        const pollInterval = 5000; // 5 seconds
    
        console.log("[BUILDING] Starting status poll loop...");
        while (!completed) {
          const statusResponse = await fetch(`${flaskUrl}/status/${taskUuid}`);
          console.log("[BUILDING] Polled status with code:", statusResponse.status);
    
          if (!statusResponse.ok) {
            console.log("[BUILDING] Flask status poll returned error code!");
            return res.status(500).json({ error: "Failed to get status from Flask app" });
          }
    
          const statusData = await statusResponse.json();
          console.log("[BUILDING] Flask statusData:", statusData);
    
          if (statusData.status === "completed" && statusData.output_json) {
            completed = true;
            finalOutput = statusData.output_json;
            console.log("[BUILDING] Task completed, output JSON found.");
            break;
          }
    
          console.log("[BUILDING] Task not completed yet, waiting 5 seconds...");
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
    
        if (!finalOutput) {
          console.log("[BUILDING] Task ended but no finalOutput was found!");
          return res.status(500).json({ error: "Task did not complete successfully" });
        }
    
        // Ensure building directory exists and save the output JSON.
        console.log("[BUILDING] Saving final output to building folder...");
        const buildingFolder = path.join(projectDir, "building");
        if (!fs.existsSync(buildingFolder)) {
          fs.mkdirSync(buildingFolder, { recursive: true });
        }
        const outputFilePath = path.join(buildingFolder, "geo_polygon_definitions.json");
        fs.writeFileSync(outputFilePath, JSON.stringify(finalOutput, null, 2));
    
        // Insert a record into the MongoDB files collection.
        console.log("[BUILDING] Inserting record into MongoDB...");
        await filesCollection.insertOne({
          project_id: id,
          file_name: "building/geo_polygon_definitions.json",
          created_at: new Date(),
        });
    
        console.log("[BUILDING] Building footprint processed and saved successfully.");
        return res.status(200).json({ message: "Building footprint processed and saved successfully" });
      } catch (error) {
        console.error("[BUILDING] Error during POST process:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
    
  
    
    else if (req.method === "DELETE") {
      console.log("Checking building directory:", buildingDir);
      if (!fs.existsSync(buildingDir)) {
        return res.status(404).json({ error: "Building directory not found" });
      }

      // Delete all files inside /building directory
      fs.readdirSync(buildingDir).forEach((file) => {
        fs.unlinkSync(path.join(buildingDir, file));
      });

      return res.status(200).json({ message: "Building contents deleted successfully" });
    }

    else {
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
