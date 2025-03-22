//api/projects/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import getMongoDb from "@/lib/mongo"; 
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

interface CreateProjectPayload {
  name: string;
  description: string;
  user_id: string;
  center?: { lat: number; lng: number }; 
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract user_id from query params or request body
  const userId = req.query.user_id as string || req.body.user_id;

  if (!userId) {
    console.log("❌ Unauthorized request: user_id is missing.");
  } else {
    console.log(`✅ Request received with user_id: ${userId}`);
  }

  if (req.method === "GET") {
    try {
      // Fetch projects owned by the user
      const ownedProjects = await prisma.projects.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
          user_id: true,
          image_url: true,
          center: true,
        },
      });

      // Fetch project IDs that are shared with the user
      const sharedProjectIds = await prisma.shared_project.findMany({
        where: { user_id: userId },
        select: { project_id: true },
      });

      const sharedProjectIdsList = sharedProjectIds.map((sp) => sp.project_id);

      // Fetch project details for shared projects
      const sharedProjects = await prisma.projects.findMany({
        where: { id: { in: sharedProjectIdsList } },
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
          user_id: true,
          image_url: true,
          center: true,
        },
      });

      // Merge owned and shared projects
      const allProjects = [...ownedProjects, ...sharedProjects];

      console.log(`🔍 User ${userId} retrieved ${allProjects.length} projects.`);
      res.status(200).json(allProjects);
    } catch (error) {
      console.error("❌ Error fetching projects:", error);
      res.status(500).json({ error: "Internal Server Error while fetching projects" });
    }
  } else if (req.method === "POST") {

    // Create a new project
    const { name, description, user_id, center }: CreateProjectPayload = req.body;

    if (!name || !description || !user_id) {
      return res.status(400).json({ error: "Name, description, and user_id are required" });
    }

    try {
      // Check if the user exists in PostgreSQL
      const userExists = await prisma.users.findUnique({
        where: { id: user_id },
      });

      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate project UUID and folder path
      const projectId = crypto.randomUUID();
      const projectFolder = path.join(
        process.env.LOCAL_STORAGE_URL || "/default/path",
        "projects",
        projectId
      );

      createProjectFolder(projectFolder);

      // Image URL reference
      const imageUrl = `projects/${projectId}`;

      // ✏️ Create ProjectDescription.txt
      const descriptionText = `Project Name: ${name}\nProject Description: ${description}\n`;
      const descriptionPath = path.join(projectFolder, "ProjectDescription.txt");

      try {
        fs.writeFileSync(descriptionPath, descriptionText);
        console.log("📄 ProjectDescription.txt created.");
      } catch (err) {
        console.error("❌ Failed to create ProjectDescription.txt:", err);
      }

      // **Step 1: Create project in PostgreSQL**
      const newProject = await prisma.projects.create({
        data: {
          id: projectId,
          name,
          description,
          user_id,
          image_url: imageUrl,
          center,
        },
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
          user_id: true,
          image_url: true,
          center: true,
        },
      });

      // **Step 2: Create project entry in MongoDB**
      const db = await getMongoDb();
      await db.collection("projects").insertOne({
        project_id: projectId,
        project_path: projectFolder,
        last_updated: new Date(),
      });



      res.status(201).json(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Internal Server Error while creating project" });
    }
  } else {
    // Handle unsupported methods
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

/**
 * Create a folder if it doesn't exist.
 * @param folderPath Path to the folder to create
 */
function createProjectFolder(folderPath: string) {
  if (!fs.existsSync(folderPath)) {
    try {
      fs.mkdirSync(folderPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating folder at ${folderPath}:`, error);
      throw new Error(`Failed to create folder at ${folderPath}`);
    }
  }
}
