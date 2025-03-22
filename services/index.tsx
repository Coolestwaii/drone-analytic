import { Project } from '@/types/project';
import { getSession } from 'next-auth/react'; // Import getSession to get user_id

export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const session = await getSession(); // Get authenticated user session

    if (!session?.user?.user_id) {
      console.warn("❌ User ID not found in session.");
      return [];
    }

    const userId = session.user.user_id; // Extract user_id
    const response = await fetch(`/api/projects?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const projects = await response.json();
    return projects.map((project: Project) => ({
      ...project,
      created_at: project.created_at ? new Date(project.created_at).toISOString() : '',
      image_url: project.image_url ?? '',
    }));
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    return [];
  }
};

export const projects = await fetchProjects();
