import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

// Disable body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const uploadDir = process.env.LOCAL_STORAGE_URL || "/home/duxmazter/droneweb/uploads";

      // Ensure the directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Create a formidable instance
      const form = formidable({
        multiples: false, // Accept a single file
        uploadDir,
        keepExtensions: true, // Keep file extensions
      });

      // Parse the incoming request
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Error parsing file:", err);
          return res.status(500).json({ error: "Failed to upload file" });
        }

        // Get the uploaded file info
        const uploadedFile = files.file;
        if (!uploadedFile) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        res.status(200).json({
          message: "File uploaded successfully",
        });
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
