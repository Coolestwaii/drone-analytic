import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { email } = req.query;

    try {
      if (email) {
        // Fetch a specific user by email
        const user = await prisma.users.findUnique({
          where: { email: String(email) },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            created_at: true,
          },
        });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
      }

      // Fetch all users if no email is provided
      const users = await prisma.users.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          created_at: true,
        },
      });

      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "POST") {
    const { username, email, role } = req.body;

    if (!username || !email || !role) {
      return res.status(400).json({ error: "Username, email, and role are required" });
    }

    try {
      const newUser = await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          username,
          email,
          role,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          created_at: true,
        },
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);

      // Handle unique constraint violation (e.g., duplicate email)
      if ((error as { code: string }).code === "P2002") {
        res.status(409).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
