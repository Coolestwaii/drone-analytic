import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    // Ensure the ID is valid
    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        if (req.method === "GET") {
            // Fetch a single user by ID
            const user = await prisma.users.findUnique({ where: { id } });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            return res.status(200).json(user);
        }

        if (req.method === "PUT") {
            // Extract `username` and `role` from request body
            const { username, role } = req.body;

            if (!username || !role) {
                return res.status(400).json({ error: "Username and role are required" });
            }

            // Update user data
            const updatedUser = await prisma.users.update({
                where: { id },
                data: { username, role },
            });
            return res.status(200).json(updatedUser);
        }

        if (req.method === "DELETE") {
            // Delete a user by ID
            const deletedUser = await prisma.users.delete({ where: { id } });
            return res.status(200).json({
                message: `User with id ${id} has been deleted.`,
                user: deletedUser,
            });
        }

        // Method not allowed
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error(`Error handling ${req.method} request:`, error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
