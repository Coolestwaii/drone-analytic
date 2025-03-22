import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import getMongoDb from "@/lib/mongo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id, file } = req.query;

  if (!id || typeof id !== "string" || !file || typeof file !== "string") {
    return res.status(400).json({ error: "Invalid project ID or file name" });
  }

  try {
    const db = await getMongoDb();
    const filesCollection = db.collection("files");

    // Find the image record in MongoDB
    const imageRecord = await filesCollection.findOne({ project_id: id, file_name: file, file_type: "image" });

    if (!imageRecord) {
      return res.status(404).json({ error: "Image not found in project" });
    }

    // Define project paths
    const projectDir = path.join(process.env.LOCAL_STORAGE_URL || "C:/Users/beckt/droneuploads", "projects", id);
    const imagePath = path.join(projectDir, file);
    const archiveDir = path.join(projectDir, "archived");
    const archivedImagePath = path.join(archiveDir, file);

    // Ensure the "archived" directory exists
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Move the file to the "archived" directory
    if (fs.existsSync(imagePath)) {
      fs.rename(imagePath, archivedImagePath, async (renameErr) => {
        if (renameErr) {
          console.error(`[DELETE IMAGE] Error moving file to archive: ${renameErr}`);
          return res.status(500).json({ error: "Failed to archive image file" });
        }

        console.log(`[DELETE IMAGE] Successfully moved file to archive: ${archivedImagePath}`);

        // Remove from MongoDB
        await filesCollection.deleteOne({ _id: imageRecord._id });

        return res.status(200).json({ message: "Image archived successfully" });
      });
    } else {
      console.warn(`[DELETE IMAGE] File not found in directory: ${imagePath}`);
      // Still delete from DB even if file doesn't exist
      await filesCollection.deleteOne({ _id: imageRecord._id });
      return res.status(200).json({ message: "Image archived successfully (file not found in storage)" });
    }
  } catch (error) {
    console.error("[DELETE IMAGE] Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
