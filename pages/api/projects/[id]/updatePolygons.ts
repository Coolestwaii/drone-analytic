import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const BASE_UPLOAD_DIR = process.env.LOCAL_STORAGE_URL || "/home/duxmazter/droneweb/uploads/";
const GEOJSON_FILE = path.join(BASE_UPLOAD_DIR, "building", "geo_polygon_definitions.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { polygonId, updatedCoordinates } = req.body;

  if (!polygonId || !Array.isArray(updatedCoordinates)) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    let polygons = [];

    // Read existing file
    if (fs.existsSync(GEOJSON_FILE)) {
      const data = fs.readFileSync(GEOJSON_FILE, "utf-8");
      polygons = JSON.parse(data);
    }

    // Update polygon
    const polygonIndex = polygons.findIndex((p: { polygonid: string }) => p.polygonid === polygonId);
    if (polygonIndex !== -1) {
      polygons[polygonIndex].coordinates = updatedCoordinates;
    } else {
      return res.status(404).json({ error: "Polygon not found" });
    }

    // Save updated file
    fs.writeFileSync(GEOJSON_FILE, JSON.stringify(polygons, null, 2));

    return res.status(200).json({ message: "Polygon updated successfully" });
  } catch (error) {
    console.error("Error updating geo_polygon_definitions.json:", error);
    return res.status(500).json({ error: "Failed to update geo_polygon_definitions.json" });
  }
}
