import { NextApiRequest, NextApiResponse } from "next";
import getMongoDb from "@/lib/mongo";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid project ID" });
    }

    const db = await getMongoDb();

    // ✅ Fix: Convert `projectId` correctly (UUIDs are stored as strings)
    const projectFilter = ObjectId.isValid(id) ? { projectId: new ObjectId(id) } : { projectId: id };

    if (req.method === "GET") {
        // ✅ Fetch all GCPs for a project
        try {
            const gcps = await db.collection("gcps").find(projectFilter).toArray();
            return res.status(200).json({ gcps });
        } catch (error) {
            console.error("Error fetching GCPs:", error);
            return res.status(500).json({ error: "Failed to fetch GCPs" });
        }
    } 
    
    else if (req.method === "POST") {
        // ✅ Create a New GCP (with Validation)
        const { name, lat, lng, altitude, coordinateSystem } = req.body;

        if (!name || lat === undefined || lng === undefined || altitude === undefined) {
            return res.status(400).json({ error: "Missing required fields: name, lat, lng, altitude" });
        }

        try {
            const newGcp = {
                projectId: id, // ✅ Store projectId as a STRING instead of ObjectId
                name,
                lat,
                lng,
                altitude,
                coordinateSystem: coordinateSystem || "EPSG:4326", // Default EPSG:4326
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await db.collection("gcps").insertOne(newGcp);
            return res.status(201).json({ insertedId: result.insertedId });
        } catch (error) {
            console.error("Error creating GCP:", error);
            return res.status(500).json({ error: "Failed to create GCP" });
        }
    } 
    
    else if (req.method === "PATCH") {
        // ✅ Update GCP (Name, Lat/Lng, Altitude, Coordinate System)
        const { gcpId, name, lat, lng, altitude, coordinateSystem } = req.body;

        if (!gcpId) {
            return res.status(400).json({ error: "Missing required field: gcpId" });
        }

        // ✅ Fix: Convert `gcpId` correctly
        const gcpFilter = ObjectId.isValid(gcpId) ? { _id: new ObjectId(gcpId) } : { _id: gcpId };

        try {
            // Build update object dynamically
            interface UpdateFields {
              name?: string;
              lat?: number;
              lng?: number;
              altitude?: number;
              coordinateSystem?: string;
              updatedAt?: Date;
            }

            const updateFields: UpdateFields = {};
            if (name) updateFields.name = name;
            if (lat !== undefined) updateFields.lat = lat;
            if (lng !== undefined) updateFields.lng = lng;
            if (altitude !== undefined) updateFields.altitude = altitude;
            if (coordinateSystem) updateFields.coordinateSystem = coordinateSystem;

            // ✅ Prevent empty updates
            if (Object.keys(updateFields).length === 0) {
                return res.status(400).json({ error: "No fields provided for update" });
            }

            updateFields.updatedAt = new Date(); // Update timestamp

            const result = await db.collection("gcps").updateOne(gcpFilter, { $set: updateFields });

            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: "GCP not found or no update performed" });
            }

            return res.status(200).json({ message: "GCP updated successfully" });
        } catch (error) {
            console.error("Error updating GCP:", error);
            return res.status(500).json({ error: "Failed to update GCP" });
        }
    } 
    
    else if (req.method === "DELETE") {
        // ✅ Remove a GCP (also deletes related images in picker)
        const { gcpId } = req.body;

        if (!gcpId) {
            return res.status(400).json({ error: "Missing required field: gcpId" });
        }

        // ✅ Fix: Convert `gcpId` correctly
        const gcpFilter = ObjectId.isValid(gcpId) ? { _id: new ObjectId(gcpId) } : { _id: gcpId };

        try {
            // Delete GCP
            const deleteResult = await db.collection("gcps").deleteOne(gcpFilter);

            if (deleteResult.deletedCount === 0) {
                return res.status(404).json({ error: "GCP not found" });
            }

            // Also delete from gcp_images
            const deleteImageRefs = await db.collection("gcp_images").deleteMany({ gcpId });

            return res.status(200).json({
                message: "GCP deleted successfully",
                deletedImages: deleteImageRefs.deletedCount,
            });
        } catch (error) {
            console.error("Error deleting GCP:", error);
            return res.status(500).json({ error: "Failed to delete GCP" });
        }
    } 
    
    else {
        res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
