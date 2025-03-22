//api/projects/%5Bid%5D/gcps/export.ts
import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import getMongoDb from "@/lib/mongo";

// Disable body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const db = await getMongoDb();
    const gcpCollection = db.collection("gcps");
    const gcpsInImagesCollection = db.collection("gcps_in_images");

    // Fetch GCPs for the project
    const gcps = await gcpCollection.find({ projectId: id }).toArray();
    if (!gcps || gcps.length === 0) {
      return res.status(404).json({ error: "No GCPs found for project" });
    }

    // Get the CRS from the first GCP
    const crs = gcps[0].coordinateSystem;

    // Fetch GCPs in images
    const gcpImages = await gcpsInImagesCollection.find({ project_id: id }).toArray();
    if (!gcpImages || gcpImages.length === 0) {
      return res.status(404).json({ error: "No GCPs found in images for project" });
    }

    // Create a map of GCP IDs to their lat/lon/alt info
    const gcpIdMap = gcps.reduce((map, gcp) => {
      map[gcp._id.toString()] = { lon: gcp.lat, lat: gcp.lng, alt: gcp.altitude, name: gcp.name };
      return map;
    }, {} as Record<string, { lon: number; lat: number; alt: number; name: string }>);

    // Construct the export data
    let exportContent = `${crs}\n`;
    for (const gcpImage of gcpImages) {
      const gcp = gcpIdMap[gcpImage.gcp_id];
      if (!gcp) {
        console.warn(`[EXPORT] Skipping unknown GCP ID: ${gcpImage.gcp_id}`);
        continue;
      }

      const line = `${gcp.lon}\t${gcp.lat}\t${gcp.alt}\t${gcpImage.x}\t${gcpImage.y}\t${gcpImage.file_name}\t${gcp.name}`;
      exportContent += line + "\n";
    }

    // Define file path
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    const filePath = path.join(exportDir, "gcp_list.txt");

    // Write to file
    fs.writeFileSync(filePath, exportContent);

    console.log("[EXPORT] gcp_list.txt generated successfully");

    // Serve the file as a response
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", "attachment; filename=gcp_list.txt");
    res.status(200).send(exportContent);
  } catch (error) {
    console.error("[EXPORT] Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
