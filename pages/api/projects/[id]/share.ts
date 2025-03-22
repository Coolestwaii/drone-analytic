import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;
  const { email } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Find the user by email
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already shared
    const existingShare = await prisma.shared_project.findFirst({
      where: { project_id: id, user_id: user.id },
    });

    if (existingShare) {
      return res.status(400).json({ error: "User is already shared on this project" });
    }

    // Add user to shared_project
    await prisma.shared_project.create({
      data: {
        project_id: id,
        user_id: user.id,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error sharing project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
