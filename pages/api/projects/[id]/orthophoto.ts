import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";
import getMongoDb from "@/lib/mongo";

const prisma = new PrismaClient();

const requiredEnvs = ["NODEODM_URL", "FASTAPI_URL", "LOCAL_STORAGE_URL"];
requiredEnvs.forEach((env) => {
  if (!process.env[env]) {
    throw new Error(`❌ Missing required environment variable: ${env}`);
  }
});

const NODEODM_URL = process.env.NODEODM_URL;
const FASTAPI_URL = process.env.FASTAPI_URL;

export const config = {
  api: {
    bodyParser: false, // Disable automatic body parsing
  },
};

const taskProgressMap: Record<
  string,
  { progress: number; message: string; taskUuid?: string }
> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const projectDir = path.join(
    process.env.LOCAL_STORAGE_URL || "/home/duxmazter/droneweb/uploads",
    "projects", 
    id
  );

  if (req.method === "POST") {
    try {
      const project = await prisma.projects.findUnique({
        where: { id: id },
      });

      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }
    }catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    try {
      const validExtensions = [".jpg", ".png", ".tif", ".tiff"];
      const imageFiles = fs
        .readdirSync(projectDir)
        .filter((file) => validExtensions.includes(path.extname(file).toLowerCase()))
        .map((file) => path.join(projectDir, file));
    
      if (imageFiles.length === 0) {
        res.status(400).json({ error: "No valid image files found in the project folder" });
        return;
      }
    
      // ✅ Get GCP Data from MongoDB
      const db = await getMongoDb();
      const gcpCollection = db.collection("gcps");
      const gcpsInImagesCollection = db.collection("gcps_in_images");
    
      const gcps = await gcpCollection.find({ projectId: id }).toArray();
      const gcpImages = await gcpsInImagesCollection.find({ project_id: id }).toArray();
      const gcpFilePath = path.join(projectDir, "gcp_list.txt");

      if (!gcps || gcps.length === 0 || !gcpImages || gcpImages.length === 0) {
        console.warn("[GCP EXPORT] No GCPs available, skipping gcp_list.txt.");
      } else {

        const crs = gcps[0].coordinateSystem;
        let exportContent = `${crs}\n`;
    
        // Create a lookup map for GCP IDs
        const gcpIdMap = gcps.reduce((map, gcp) => {
          map[gcp._id.toString()] = { lon: gcp.lng, lat: gcp.lat, alt: gcp.altitude, name: gcp.name };
          return map;
        }, {} as Record<string, { lon: number; lat: number; alt: number; name: string }>);
    
        for (const gcpImage of gcpImages) {
          const gcp = gcpIdMap[gcpImage.gcp_id];
          if (!gcp) continue;
          exportContent += `${gcp.lon}\t${gcp.lat}\t${gcp.alt}\t${gcpImage.x}\t${gcpImage.y}\t${gcpImage.file_name}\t${gcp.name}\n`;
        }
    
        fs.writeFileSync(gcpFilePath, exportContent);
        console.log("[GCP EXPORT] gcp_list.txt created successfully.");
      }
    
      // ✅ Attach Images and GCP File to FormData
      const formData = new FormData();
      imageFiles.forEach((file) => formData.append("images", fs.createReadStream(file)));
    
      // ✅ Append GCP file as an "image" (only if it exists)
      if (fs.existsSync(gcpFilePath)) {
        formData.append("images", fs.createReadStream(gcpFilePath), "gcp_list.txt");
        console.log("[UPLOAD] Attached GCP file as an image: gcp_list.txt");
      } else {
        console.warn("[UPLOAD] No gcp_list.txt found, proceeding without it.");
      }
    
      formData.append("options", JSON.stringify([{ name: "fast-orthophoto", value: true }]));
    
      const nodeOdmResponse = await fetch(`${NODEODM_URL}/task/new`, {
        method: "POST",
        body: formData,
      });
    
      if (!nodeOdmResponse.ok) {
        res.status(500).json({ error: "Failed to create NodeODM task" });
        return;
      }
    
      const responseJson = await nodeOdmResponse.json();
      const taskUuid = responseJson.uuid;
    
      taskProgressMap[id] = {
        progress: 5,
        message: `Task created. Task UUID: ${taskUuid}`,
        taskUuid,
      };
    
      res.status(200).json({ message: "Task created successfully", taskUuid });
    
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  
    const sendProgress = (progress: number, message: string) => {
      res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
    };
  
    const taskData = taskProgressMap[id];
    if (!taskData || !taskData.taskUuid) {
      sendProgress(0, "No active task found for the given project ID");
      res.end();
      return;
    }
  
    const { taskUuid } = taskData;
  
    const interval = setInterval(async () => {
      try {
        const taskInfoResponse = await fetch(`${NODEODM_URL}/task/${taskUuid}/info`);
        const taskInfo = await taskInfoResponse.json();
  
        const progress = taskInfo.progress || 0;
        const status = taskInfo.status.code;
  
        sendProgress(progress, `Processing (${progress}%)`);
  
        if (status === 40 && progress === 100) {
          clearInterval(interval);
          sendProgress(60, "Task completed. Downloading results...");
  
          const zipUrl = `${NODEODM_URL}/task/${taskUuid}/download/all.zip`;
          const zipPath = path.join(projectDir, "all.zip");
  
          try {
            const downloadResponse = await fetch(zipUrl);
            const fileStream = fs.createWriteStream(zipPath);
  
            await new Promise((resolve, reject) => {
              downloadResponse.body.pipe(fileStream);
              downloadResponse.body.on("error", reject);
              fileStream.on("finish", resolve);
            });
  
            sendProgress(80, "Download complete. Extracting assets...");
  
            // Call FastAPI for further processing
            const fastApiResponse = await fetch(`${FASTAPI_URL}/projects/${id}/process`, {
              method: "POST",
            });
  
            if (!fastApiResponse.ok) {
              throw new Error(`FastAPI returned status ${fastApiResponse.status}`);
            }
  
            const fastApiResult = await fastApiResponse.json();
            sendProgress(90, "Assets processed successfully.");

            // **Insert orthophoto file records into MongoDB**
            try {
              const db = await getMongoDb();
              await db.collection("files").insertMany([
                {
                  project_id: id,
                  file_name: "odm_orthophoto/odm_orthophoto.tif",
                  file_type: "orthophoto",
                  created_at: new Date(),
                },
                {
                  project_id: id,
                  file_name: "odm_orthophoto/odm_orthophoto.png",
                  file_type: "orthophoto",
                  created_at: new Date(),
                },
                {
                  project_id: id,
                  file_name: "bounds.json",
                  file_type: "json",
                  created_at: new Date(),
                },
                {
                  project_id: id,
                  file_name: "odm_report/shots.geojson",
                  file_type: "geojson",
                  created_at: new Date(),
                }

              ]);

              sendProgress(95, "Orthophoto files registered successfully in the database.");
            } catch (dbError) {
              console.error("Database error:", dbError);
              sendProgress(0, "Error storing orthophoto metadata.");
            }
            sendProgress(100, JSON.stringify(fastApiResult)); // Send final response
  
            res.end(); // Final end of SSE
  
          } catch (error) {
            console.error("Error during processing:", error);
            const errorMessage = error instanceof Error ? error.message : "An error occurred";
            sendProgress(0, `Error: ${errorMessage}`);
            res.end(); // Handle clean exit
          }
        }
      } catch (error) {
        console.error("Error fetching task info:", error);
        sendProgress(0, "Error fetching progress from NodeODM");
        clearInterval(interval);
        res.end();
      }
    }, 1000);
  
    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  }
   else if (req.method === "DELETE") {
    try {
      const { uuid } = req.body;

      if (!uuid) {
        res.status(400).json({ error: "Task UUID is required" });
        return;
      }

      const nodeOdmResponse = await fetch(`${NODEODM_URL}/task/remove`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uuid }),
      });

      if (!nodeOdmResponse.ok) {
        const errorMessage = await nodeOdmResponse.text();
        console.error("NodeODM Error:", errorMessage);
        res.status(500).json({ error: "Failed to cancel NodeODM task" });
        return;
      }

      const responseJson = await nodeOdmResponse.json();
      res.status(200).json({ message: "Task canceled successfully", ...responseJson });
    } catch (error) {
      console.error("Error canceling task:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET", "DELETE"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
