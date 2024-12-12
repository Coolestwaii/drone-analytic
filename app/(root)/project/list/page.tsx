'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { projects } from '@/constant'; // Ensure correct path for your projects
import { AiOutlineSearch, AiOutlinePlus, AiOutlineEdit } from 'react-icons/ai';
import AddProject from '@/components/AddProject'; // Import AddProject component
import Image from 'next/image'; // Import Image from next/image

const ProjectList = () => {
  const { id } = useParams(); // Get the id from the URL
  const router = useRouter(); // To handle navigation programmatically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project, setProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // State for search input
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [isAddingProject, setIsAddingProject] = useState(false); // State to toggle add project form

  useEffect(() => {
    // If the id changes, find the project based on the id from the URL
    const foundProject = projects.find((project) => project.id === id);
    if (foundProject) {
      setProject(foundProject);
    }
  }, [id]);

  // Handle search query and filter projects
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    const filtered = projects.filter((project) =>
      project.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredProjects(filtered);
  };

  // Handle Add New Project button click
  const handleAddProjectClick = () => {
    setIsAddingProject(true); // Switch to AddProject view
  };

  // If no project is found, show a message
  if (!project && !isAddingProject) {
    return (
      <div className="p-6 space-y-6 ">
        {/* Search Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center bg-gray-50 border-2 rounded-full w-full max-w-[500px] p-2 shadow-md">
            <AiOutlineSearch className="text-xl text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-transparent outline-none placeholder-gray-500 text-lg"
            />
          </div>
          <button
            onClick={handleAddProjectClick}
            className="bg-green-500 text-white p-2 ml-2 rounded-[10px] flex items-center gap-2 hover:bg-green-600 transition-colors"
          >
            <AiOutlinePlus />
            <span>Project</span>
          </button>
        </div>

        {/* Project Cards List */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/project/${project.id}`)}
              className="cursor-pointer flex items-center gap-6 bg-white p-4 mb-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow ease-in-out"
            >
              {/* Project Image */}
              <Image
                src={project.cover}
                alt={project.name}
                width={96} // Specify width
                height={96} // Specify height
                className="object-cover rounded-lg"
              />
              <div className="flex-1">
                {/* Project Title */}
                <h3 className="font-semibold text-xl text-gray-900">{project.name}</h3>
                {/* Project Description */}
                <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                {/* Project Meta */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">{project.date}</span>
                </div>
              </div>
              <AiOutlineEdit className="text-xl text-gray-500 hover:text-gray-700 cursor-pointer transition-colors" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // When a project is found, display its details
  if (!isAddingProject && project) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-lg text-gray-700">{project.description}</p>
        <p className="text-sm text-gray-500">{project.date}</p>
      </div>
    );
  }

  // Show Add Project Component when isAddingProject is true
  if (isAddingProject) {
    return <AddProject />;
  }

  return null;
};

export default ProjectList;
