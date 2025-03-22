import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import getMongoDb from "@/lib/mongo";

// Disable body parsing for formidable
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
  const projectUploadDir = path.join(baseUploadDir, "projects", id);

  if (req.method === "POST") {
    try {
      // Ensure the project-specific folder exists
      if (!fs.existsSync(projectUploadDir)) {
        fs.mkdirSync(projectUploadDir, { recursive: true });
      }

      // Set up formidable for file uploads with custom filename handler
      const form = formidable({
        multiples: true, // Support multiple files
        uploadDir: projectUploadDir,
        keepExtensions: true,
        filename: (name, ext, part) => {
          // Use the original filename or generate a sanitized version
          const sanitizedFilename = part.originalFilename?.replace(/\s+/g, "_") || "file";
          return sanitizedFilename;
        },
      });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Error uploading file:", err);
          return res.status(500).json({ error: "Failed to upload files" });
        }

        // Log uploaded files
        console.log("Fields:", fields);
        console.log("Files:", files);

        // Validate and handle uploaded files
        const uploadedFiles = [];
        if (files.csvFile) {
          const csvFile = Array.isArray(files.csvFile) ? files.csvFile[0] : files.csvFile;
          uploadedFiles.push({ type: "csv", file: csvFile });
        }

        if (files.images) {
          const images = Array.isArray(files.images) ? files.images : [files.images];
          images.forEach((image) => uploadedFiles.push({ type: "image", file: image }));
        }

      // **Update MongoDB**
      try {
        const db = await getMongoDb();

        await db.collection("files").insertMany(
          uploadedFiles.map((file) => ({
            project_id: id,
            file_name: file.file.newFilename,
            file_type: file.type,
          }))
        );
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ error: "Failed to save file information" });
      }

        if (uploadedFiles.length === 0) {
          return res.status(400).json({ error: "No valid files uploaded" });
        }

        res.status(200).json({
          message: `Files uploaded successfully to project ${id}`,
          uploadedFiles,
        });
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "GET") {
    try {
      // Check if the project-specific folder exists
      if (!fs.existsSync(projectUploadDir)) {
        return res.status(404).json({ error: "Project folder not found" });
      }

      // Read all files in the directory
      const files = fs.readdirSync(projectUploadDir).map((file) => ({
        name: file,
        path: path.join(projectUploadDir, file),
      }));

      res.status(200).json({
        files,
        message: `Files retrieved successfully for project ${id}`,
      });
    } catch (error) {
      console.error("Error listing files:", error);
      res.status(500).json({ error: "Failed to retrieve files" });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed `});
  }
}