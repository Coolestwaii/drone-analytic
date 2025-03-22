//pages/api/projects/[id]/polygon.ts
import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import getMongoDb from "@/lib/mongo";

// Constants
const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  throw new Error("❌ BASE_URL environment variable is not defined.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, layer_id } = req.query; // Project ID and Layer ID 
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  const db = await getMongoDb();
  const polygonsCollection = db.collection("polygons");
  const filesCollection = db.collection("files");

  try {
    // 🔹 GET: Retrieve all polygons for this project (Filtered by layer if specified)
    if (req.method === "GET") {
      const filter: { project_id: string; layer_id?: ObjectId } = { project_id: id };
      if (layer_id && ObjectId.isValid(layer_id as string)) {
        filter.layer_id = new ObjectId(layer_id as string);
      }

      const polygons = await polygonsCollection
        .aggregate([
          { $match: filter },
          {
            $lookup: {
              from: "layers", // Join with layers collection
              localField: "layer_id",
              foreignField: "_id",
              as: "layerDetails"
            }
          },
          {
            $addFields: {
              color: { $arrayElemAt: ["$layerDetails.color", 0] } // Extracts color
            }
          },
          {
            $project: {
              layerDetails: 0 // Remove unnecessary field
            }
          }
        ])
        .toArray();

      console.log("✅ Polygons with Color Sent to Frontend:", polygons); // Debugging step

      return res.status(200).json(polygons);
    }
    // 🔹 POST: Create new polygons (Manual, Copy from another layer, or Copy ALL from Master)
    if (req.method === "POST") {
      const { layer_id, coordinates, copy_from_layer, copy_from_master } = req.body;

      if (!layer_id || !ObjectId.isValid(layer_id)) {
        return res.status(400).json({ error: "Invalid layer ID" });
      }

      let polygonsToInsert = [];

      // ✅ **Case 1: Copy all polygons from another layer**
      if (copy_from_layer) {
        if (!ObjectId.isValid(copy_from_layer)) {
          return res.status(400).json({ error: "Invalid source layer ID" });
        }

        const polygonsFromLayer = await polygonsCollection.find({ layer_id: new ObjectId(copy_from_layer) }).toArray();
        if (!polygonsFromLayer.length) {
          return res.status(404).json({ error: "No polygons found in source layer" });
        }

        polygonsToInsert = polygonsFromLayer.map((polygon, index) => ({
          project_id: id,
          layer_id: new ObjectId(layer_id),
          name: `Polygon ${index}`, // Assign an incremented name
          coordinates: polygon.coordinates,
          created_at: new Date(),
          updated_at: new Date(),
        }));
      }
      // ✅ **Case 2: Copy ALL polygons from master dataset**
      else if (copy_from_master) {
        console.log("🔍 Checking if master polygon file exists...");

        const masterFile = await filesCollection.findOne({
          project_id: id,
          file_name: "building/geo_polygon_definitions.json",
        });

        if (!masterFile) {
          console.error("❌ Master file metadata not found in database.");
          return res.status(404).json({ error: "Master file not found for this project" });
        }

        const fileURL = `${BASE_URL}/api/projects/${id}/assets?action=serve&file=building/geo_polygon_definitions.json`;
        console.log("📡 Fetching master file from:", fileURL);

        try {
          const masterResponse = await fetch(fileURL);

          if (!masterResponse.ok) {
            console.error("❌ Failed to fetch master polygons. Response status:", masterResponse.status);
            return res.status(500).json({ error: "Failed to fetch master polygons" });
          }

          const masterPolygons = await masterResponse.json();
          console.log("✅ Master file fetched successfully. Checking polygons...");

          if (!Array.isArray(masterPolygons) || masterPolygons.length === 0) {
            console.error("❌ Invalid or empty master dataset.");
            return res.status(404).json({ error: "No polygons found in master dataset" });
          }

          console.log(`📌 Found ${masterPolygons.length} polygons in master. Copying to layer...`);

          polygonsToInsert = masterPolygons.map((polygon, index) => ({
            project_id: id,
            layer_id: new ObjectId(layer_id),
            name: `Polygon ${index}`, // Assign an incremented name
            coordinates: polygon.coordinates,
            created_at: new Date(),
            updated_at: new Date(),
          }));

        } catch (error) {
          console.error("🔥 Error while fetching master polygons:", error);
          return res.status(500).json({ error: "Internal server error while fetching master polygons" });
        }
      }
      // ✅ **Case 3: Manually add polygon**
      else {
        if (!Array.isArray(coordinates) || coordinates.length < 3) {
          return res.status(400).json({ error: "Polygon must have at least 3 coordinates" });
        }

        // Get the current polygon count in this layer to generate a new name
        const existingPolygonCount = await polygonsCollection.countDocuments({ layer_id: new ObjectId(layer_id) });

        polygonsToInsert = [
          {
            project_id: id,
            layer_id: new ObjectId(layer_id),
            name: `Polygon ${existingPolygonCount}`, // Assign an incremented name
            coordinates,
            created_at: new Date(),
            updated_at: new Date(),
          }
        ];
      }

      // Insert all polygons into MongoDB
      if (polygonsToInsert.length > 0) {
        const result = await polygonsCollection.insertMany(polygonsToInsert);
        const insertedPolygons = await polygonsCollection.find({ _id: { $in: Object.values(result.insertedIds) } }).toArray();

        console.log(`✅ Successfully copied ${insertedPolygons.length} polygons.`);
        return res.status(201).json(insertedPolygons);
      } else {
        return res.status(400).json({ error: "No polygons to insert" });
      }
    }

    // 🔹 PATCH: Update polygon name or coordinates
    if (req.method === "PATCH") {
      const { polygon_id, coordinates, name } = req.body;

      if (!polygon_id || !ObjectId.isValid(polygon_id)) {
        return res.status(400).json({ error: "Invalid polygon ID" });
      }
      if (coordinates && (!Array.isArray(coordinates) || coordinates.length < 3)) {
        return res.status(400).json({ error: "Polygon must have at least 3 coordinates" });
      }

      const updateFields: Record<string, unknown> = { updated_at: new Date() };
      if (coordinates) updateFields.coordinates = coordinates;
      if (name) updateFields.name = name;

      const result = await polygonsCollection.updateOne(
        { _id: new ObjectId(polygon_id), project_id: id },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Polygon not found" });
      }

      const updatedPolygon = await polygonsCollection.findOne({ _id: new ObjectId(polygon_id) });

      return res.status(200).json(updatedPolygon);
    }

    // 🔹 DELETE: Remove a polygon
    if (req.method === "DELETE") {
      const { polygon_id } = req.body;
  
      console.log("Received DELETE request for polygon:", polygon_id);
  
      if (!polygon_id || !ObjectId.isValid(polygon_id)) {
          console.error("Invalid polygon ID received:", polygon_id);
          return res.status(400).json({ error: "Invalid polygon ID" });
      }
  
      const deleteResult = await polygonsCollection.deleteOne({ _id: new ObjectId(polygon_id), project_id: id });
  
      if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ error: "Polygon not found" });
      }
  
      return res.status(200).json({ message: "Polygon deleted successfully" });
  }
  
    return res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]).status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Error processing polygons:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
