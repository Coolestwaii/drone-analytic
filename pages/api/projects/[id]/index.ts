import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import getMongoDb from "@/lib/mongo";
import fs from "fs";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid project ID" });
    }

    if (req.method === "GET") {
        // Fetch a single project by ID
        try {
            const project = await prisma.projects.findUnique({ where: { id } });
            if (!project) {
                return res.status(404).json({ error: "Project not found" });
            }
            res.status(200).json(project);
        } catch (error) {
            console.error("Error fetching project:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    } else if (req.method === "PUT") {
        // Update a project by ID
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        try {
            // 1. Update project in PostgreSQL
            const updatedProject = await prisma.projects.update({
                where: { id },
                data: { name, description },
            });

            // 2. Get LOCAL_STORAGE_URL or fallback path
            const projectFolder = path.join(
                process.env.LOCAL_STORAGE_URL || "/home/duxmazter/droneweb/uploads",
                "projects",
                id
            );
        
            // 3. Write ProjectDescription.txt with updated info
            const descriptionText = `Project Name: ${updatedProject.name}\nProject Description: ${updatedProject.description || ""}\n`;
            const descriptionFile = path.join(projectFolder, "ProjectDescription.txt");
        
            try {
                fs.writeFileSync(descriptionFile, descriptionText);
                console.log("✏️ ProjectDescription.txt updated.");
            } catch (err) {
                console.error("❌ Failed to update ProjectDescription.txt:", err);
            }
        
            // 4. Respond to client
            res.status(200).json(updatedProject);
        } catch (error) {
            console.error("Error updating project:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    } else if (req.method === "DELETE") {
        try {
            const projectFolderPath = path.join(process.cwd(), "uploads", id);
            const archivedFolderPath = path.join(process.cwd(), "archived", id);
    
            // Ensure archived folder exists
            if (!fs.existsSync(path.join(process.cwd(), "archived"))) {
                fs.mkdirSync(path.join(process.cwd(), "archived"), { recursive: true });
            }
    
            // Move project folder to /archived safely
            if (fs.existsSync(projectFolderPath)) {
                try {
                    fs.renameSync(projectFolderPath, archivedFolderPath);
                } catch (err) {
                    console.error("Error moving project folder:", err);
                }
            }
    
            // Delete project from PostgreSQL
            const deletedProject = await prisma.projects.delete({ where: { id } });
    
            // Delete related documents from MongoDB
            const db = await getMongoDb();
            await db.collection("files").deleteMany({ project_id: id });
            await db.collection("project_files").deleteMany({ project_id: id });
    
            res.status(200).json({ 
                message: `Project with id ${id} is deleted and moved to /archived`, 
                project: deletedProject 
            });
    
        } catch (error) {
            console.error("Error deleting project:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    } else {
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
