import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import getMongoDb from "@/lib/mongo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  const db = await getMongoDb();
  const layersCollection = db.collection("layers");
  const polygonsCollection = db.collection("polygons"); // Collection storing polygons

  try {
    // 🔹 GET: Retrieve all layers for this project
    if (req.method === "GET") {
      const layers = await layersCollection.find({ project_id: id }).toArray();
      return res.status(200).json(layers);
    }

    // 🔹 POST: Create a new layer
    if (req.method === "POST") {
        const { name, description, color } = req.body;
        if (!name) {
        return res.status(400).json({ error: "Layer name is required" });
        }
    
        const newLayer = {
        project_id: id,
        name,
        description: description || "",
        color: color || "#FF5733", // Default color
        created_at: new Date(),
        updated_at: new Date(),
        };
    
        const result = await layersCollection.insertOne(newLayer);
        
        // Retrieve the newly inserted document
        const insertedLayer = await layersCollection.findOne({ _id: result.insertedId });
    
        return res.status(201).json(insertedLayer);
    }
    
    // 🔹 PATCH: Update layer name or color
    if (req.method === "PATCH") {
        const { layer_id, name, color } = req.body;
    
        if (!layer_id || !ObjectId.isValid(layer_id)) {
        return res.status(400).json({ error: "Invalid layer ID" });
        }
    
        // Prepare update object
        const updateFields: Partial<{ name: string; color: string; updated_at: Date }> = {};
        if (name) updateFields.name = name;
        if (color) updateFields.color = color;
        updateFields.updated_at = new Date();
    
        if (Object.keys(updateFields).length === 1) {
        return res.status(400).json({ error: "No valid fields to update" });
        }
    
        const result = await layersCollection.updateOne(
        { _id: new ObjectId(layer_id), project_id: id },
        { $set: updateFields }
        );
    
        if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Layer not found" });
        }
    
        // Retrieve updated layer
        const updatedLayer = await layersCollection.findOne({ _id: new ObjectId(layer_id) });
    
        return res.status(200).json(updatedLayer);
    }
  
    // 🔹 DELETE: Remove a layer and its polygons (Cascade Delete)
    if (req.method === "DELETE") {
      const { layer_id } = req.body;

      if (!layer_id || !ObjectId.isValid(layer_id)) {
        return res.status(400).json({ error: "Invalid layer ID" });
      }

      // Delete the layer
      const layerDeleteResult = await layersCollection.deleteOne({ _id: new ObjectId(layer_id), project_id: id });

      if (layerDeleteResult.deletedCount === 0) {
        return res.status(404).json({ error: "Layer not found" });
      }

      // Delete all polygons that belong to this layer
      const polygonDeleteResult = await polygonsCollection.deleteMany({ layer_id });

      return res.status(200).json({
        message: "Layer and associated polygons deleted successfully",
        deletedPolygons: polygonDeleteResult.deletedCount,
      });
    }

    return res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]).status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Error processing layers:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
