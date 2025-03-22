import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import sharp from "sharp"; // For image resizing
import { exec } from "child_process";
import getMongoDb from "@/lib/mongo";

// Disable body parsing for formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

// Constants
const MAX_THUMBNAIL_SIZE = 1024 * 1024; // 1 MB
const BASE_UPLOAD_DIR = process.env.LOCAL_STORAGE_URL || "/home/duxmazter/droneweb/uploads";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  const projectUploadDir = path.join(BASE_UPLOAD_DIR, "projects", id);
  
 if (req.method === "GET") {
    // Handle GET requests with actions
    const { action, file, size } = req.query;

    try {
      if (action === "list") {
        try {
            const db = await getMongoDb();
            const filesCollection = db.collection("files");
    
            // Fetch all files related to the project from MongoDB
            const filesFromDb = await filesCollection
                .find({ project_id: id })
                .toArray();
    
            // Convert database records into response format
            const dbFiles = filesFromDb.map(file => ({
                file_name: file.file_name, // Correct field name
                file_type: file.file_type, // Include file type
                path: path.join(projectUploadDir, file.file_name),
            }));
    
            return res.status(200).json({
                files: dbFiles,
                message: "Files retrieved successfully",
            });
    
        } catch (error) {
            console.error("Error fetching file list:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
     else if (action === "metadata") {
        // Fetch file metadata using exiftool
        if (!file || typeof file !== "string") {
          return res.status(400).json({ error: "Missing or invalid 'file' parameter" });
        }

        const filePath = path.join(projectUploadDir, file);

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "File not found" });
        }

        exec(`exiftool "${filePath}" -json`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error fetching metadata for file ${file}:`, error);
            return res.status(500).json({ error: "Failed to fetch metadata" });
          }

          if (stderr) {
            console.error(`Exiftool stderr for file ${file}:`, stderr);
            return res.status(500).json({ error: stderr });
          }

          try {
            const metadata = JSON.parse(stdout)[0]; // Parse JSON output
            return res.status(200).json({
              message: "Metadata retrieved successfully",
              file: file,
              metadata,
            });
          } catch (parseError) {
            console.error("Error parsing exiftool output:", parseError);
            return res.status(500).json({ error: "Failed to parse metadata output" });
          }
        });

      } else if (action === "serve") {
        try {
            if (!file || typeof file !== "string") {
                return res.status(400).json({ error: "Missing or invalid 'file' parameter" });
            }
    
            // Fetch the file details from MongoDB
            const db = await getMongoDb();
            const fileRecord = await db.collection("files").findOne({ project_id: id, file_name: file });
    
            if (!fileRecord) {
                return res.status(404).json({ error: "File not found in database" });
            }
    
            // Construct the absolute file path based on the stored path
            const filePath = path.join(BASE_UPLOAD_DIR, "projects", id, fileRecord.file_name);
    
            // Validate file existence in the file system
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: "File not found on disk" });
            }
    
            // Detect if it's an image
            const stats = fs.statSync(filePath);
            const isImage = /\.(jpg|jpeg|png|webp|tif)$/i.test(filePath);
    
            if ((size === "small" || size === "medium") && isImage && stats.size > MAX_THUMBNAIL_SIZE) {
                try {
                    // Define width based on requested size
                    const width = size === "small" ? 200 : 500;
    
                    const resizedImage = await sharp(filePath).resize({ width }).toBuffer();
                    res.setHeader("Content-Type", "image/jpeg");
                    return res.status(200).send(resizedImage);
                } catch (error) {
                    console.error("Error generating resized image:", error);
                    return res.status(500).json({ error: "Failed to generate resized image" });
                }
            } else {
                // Serve the original file
                const mimeType = isImage ? "image/" + path.extname(filePath).slice(1) : "application/octet-stream";
                res.setHeader("Content-Type", mimeType);
                res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
                const fileStream = fs.createReadStream(filePath);
                return fileStream.pipe(res);
            }
        } catch (error) {
            console.error("Error serving file:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
     else {
        return res.status(400).json({ error: "Invalid 'action' parameter" });
      }
    } catch (error) {
      console.error("Error processing GET request:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
