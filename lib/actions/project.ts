import prisma from '../prisma';

export async function getProjects() {
  try {
    const projects = await prisma.projects.findMany();
    return { projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { projects: [] };
  }
}