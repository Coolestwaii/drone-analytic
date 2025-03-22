import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import getMongoDb from "@/lib/mongo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getMongoDb();
  const polygonsCollection = db.collection("polygons");

  try {
    // 🔹 DELETE: Remove a polygon using `layer_id` and `polygon_id`
    if (req.method === "DELETE") {
      const { polygon_id, layer_id } = req.body;

      console.log("🔹 Received DELETE request for polygon:", polygon_id, "in layer:", layer_id);

      if (!polygon_id || !ObjectId.isValid(polygon_id)) {
        console.error("❌ Invalid polygon ID received:", polygon_id);
        return res.status(400).json({ error: "Invalid polygon ID" });
      }
      if (!layer_id || !ObjectId.isValid(layer_id)) {
        console.error("❌ Invalid layer ID received:", layer_id);
        return res.status(400).json({ error: "Invalid layer ID" });
      }

      const deleteResult = await polygonsCollection.deleteOne({
        _id: new ObjectId(polygon_id),
        layer_id: new ObjectId(layer_id),
      });

      if (deleteResult.deletedCount === 0) {
        console.error("❌ Polygon not found for deletion:", polygon_id);
        return res.status(404).json({ error: "Polygon not found" });
      }

      console.log("✅ Polygon deleted successfully:", polygon_id);
      return res.status(200).json({ message: "Polygon deleted successfully" });
    }

    // If method is not allowed
    return res.setHeader("Allow", ["DELETE"]).status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("🔥 Error processing polygons:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
