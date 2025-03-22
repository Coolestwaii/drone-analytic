import { NextApiRequest, NextApiResponse } from "next";
import getMongoDb from "@/lib/mongo";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Validate the project ID passed in the query string.
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  const db = await getMongoDb();
  const collection = db.collection("gcps_in_images");

  if (req.method === "GET") {
    // Optional file_id param for filtering
    const { file_id } = req.query;

    // Build a base filter by project
    const filter: Record<string, unknown> = { project_id: id };

    // If the client passes ?file_id=..., narrow the search
    if (file_id && typeof file_id === "string") {
      filter.file_id = file_id;
    }

    try {
      const docs = await collection.find(filter).toArray();
      return res.status(200).json({ gcps_in_images: docs });
    } catch (error) {
      console.error("Error fetching GCP-in-images:", error);
      return res.status(500).json({ error: "Failed to fetch GCP-in-images" });
    }

  } else if (req.method === "POST") {
    // Create a new GCP-in-image record
    const { file_id, file_name, gcp_id, x, y } = req.body;

    // Validate that all required fields are provided
    if (!file_id || !file_name || !gcp_id || x === undefined || y === undefined) {
      return res.status(400).json({ error: "Missing required fields: file_id, file_name, gcp_id, x, y" });
    }

    const newDoc = {
      project_id: id,
      file_id,          // Could be an ObjectId or string (as stored in your files collection)
      file_name,        // For convenience
      gcp_id,           // Reference to the GCP in the global gcps collection
      x: parseFloat(x),
      y: parseFloat(y),
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const result = await collection.insertOne(newDoc);
      return res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
      console.error("Error creating GCP in image record:", error);
      return res.status(500).json({ error: "Failed to create GCP in image record" });
    }
  } else if (req.method === "PATCH") {
    // Update an existing GCP-in-image record
    const { gcpImageId, name, x, y, file_id, file_name, gcp_id, coordinateSystem } = req.body;

    if (!gcpImageId) {
      return res.status(400).json({ error: "Missing required field: gcpImageId" });
    }

    // Build a filter that handles ObjectId conversion if needed
    const filter = ObjectId.isValid(gcpImageId)
      ? { _id: new ObjectId(gcpImageId) }
      : { _id: gcpImageId };

    // Dynamically build the update object; allow updates to any of the following fields
    interface UpdateFields {
      name?: string;
      x?: number;
      y?: number;
      file_id?: string;
      file_name?: string;
      gcp_id?: string;
      coordinateSystem?: string;
      updated_at?: Date;
    }

    const updateFields: UpdateFields = {};
    if (name) updateFields.name = name;
    if (x !== undefined) updateFields.x = parseFloat(x);
    if (y !== undefined) updateFields.y = parseFloat(y);
    if (file_id) updateFields.file_id = file_id;
    if (file_name) updateFields.file_name = file_name;
    if (gcp_id) updateFields.gcp_id = gcp_id;
    if (coordinateSystem) updateFields.coordinateSystem = coordinateSystem;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    updateFields.updated_at = new Date();

    try {
      const result = await collection.updateOne(filter, { $set: updateFields });
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Record not found or no update performed" });
      }
      return res.status(200).json({ message: "GCP in image updated successfully" });
    } catch (error) {
      console.error("Error updating GCP in image record:", error);
      return res.status(500).json({ error: "Failed to update GCP in image record" });
    }
  } else if (req.method === "DELETE") {
    // Delete an existing GCP-in-image record
    const { gcpImageId } = req.body;

    if (!gcpImageId) {
      return res.status(400).json({ error: "Missing required field: gcpImageId" });
    }

    const filter = ObjectId.isValid(gcpImageId)
      ? { _id: new ObjectId(gcpImageId) }
      : { _id: gcpImageId };

    try {
      const result = await collection.deleteOne(filter);
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      return res.status(200).json({ message: "GCP in image deleted successfully" });
    } catch (error) {
      console.error("Error deleting GCP in image record:", error);
      return res.status(500).json({ error: "Failed to delete GCP in image record" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
