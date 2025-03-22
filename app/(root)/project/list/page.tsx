//project/list/page.tsx
'use client';

import withAuth from '@/hoc/withAuth';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { projects } from '@/services';
import { AiOutlineSearch } from 'react-icons/ai';
import AddProject from '@/components/AddProject'; 
import Image from 'next/image'; 
import { FaFilter } from "react-icons/fa";


const ProjectList = () => {
  const { data: session, status } = useSession(); // Get the session object
  const params = useParams<{ id: string }>(); // Get the params from the URL
  const id = params?.id || ''; // Extract id or set it to an empty string if params is null
  const router = useRouter(); // To handle navigation programmatically
  interface Project {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  }

  const [project, setProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // State for search input
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [isAddingProject, setIsAddingProject] = useState(false); // State to toggle add project form
  const [projectImages, setProjectImages] = useState<Record<string, string>>({}); // Store image URLs

  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.user_id) {
      console.log("User ID:", session.user.user_id); // ✅ Log the User ID
    } else {
      console.log("User is not authenticated or missing ID.");
    }
  }, [session, status]); // Run when session or auth status changes

  useEffect(() => {
    // If the id changes, find the project based on the id from the URL
    const foundProject = projects.find((project) => project.id === id);
    if (foundProject) {
      setProject(foundProject);
    }
  }, [id]);

  // Fetch images when the component mounts
  useEffect(() => {
    const fetchProjectImages = async () => {
      const images: Record<string, string> = {};

      await Promise.all(
        projects.map(async (project) => {
          try {
            const imageUrl = `http://localhost:3000/api/projects/${project.id}/assets?action=serve&file=odm_orthophoto/odm_orthophoto.png&size=small`;
            
            // Check if the image exists
            const response = await fetch(imageUrl);
            if (response.ok) {
              images[project.id] = imageUrl; // Store the image URL
            } else {
              images[project.id] = "/placeholder.png"; // Use a default placeholder
            }
          } catch (error) {
            console.error(`Error fetching image for project ${project.id}:`, error);
            images[project.id] = "/placeholder.png"; // Use a default placeholder
          }
        })
      );

      setProjectImages(images);
    };

    fetchProjectImages();
  }, []);

  useEffect(() => {
    let filtered = projects.filter((proj) =>
      proj.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedYear !== 'All') {
      filtered = filtered.filter((proj) =>
        new Date(proj.created_at).getFullYear().toString() === selectedYear
      );
    }

    if (selectedMonth !== 'All') {
      filtered = filtered.filter((proj) =>
        (new Date(proj.created_at).getMonth() + 1).toString().padStart(2, '0') === selectedMonth
      );
    }

    if (dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);

      filtered = filtered.filter((proj) => {
        const projectDate = new Date(proj.created_at);
        return projectDate >= fromDate && projectDate <= toDate;
      });
    }

    setFilteredProjects(filtered);
  }, [searchQuery, selectedYear, selectedMonth, dateRange]);

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">Project</h1>
          <button type="button" className="button" onClick={handleAddProjectClick}>
            <span className="button__text text-sm font-medium">New Project</span>
            <span className="button__icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                viewBox="0 0 24 24"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                stroke="currentColor"
                height="24"
                fill="none"
                className="svg"
              >
                <line y2="19" y1="5" x2="12" x1="12"></line>
                <line y2="12" y1="12" x2="19" x1="5"></line>
              </svg>
            </span>
          </button>

        </div>

       {/* Search Bar */}
        <div className="relative flex items-center bg-gray-100 border border-gray-300 rounded-full p-2 shadow-sm focus-within:border-[#C0E888] focus-within:ring-2 focus-within:ring-[#C0E888] transition-all w-[400px]">
          <AiOutlineSearch className="text-xl text-gray-500 ml-3" />

          <input
            type="text"
            placeholder="Search project..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-transparent outline-none text-lg px-3 text-black placeholder-gray-400"
          />

          {/* Clear Button (X) */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filter Section */}
        <div className="text-sm">
        <div className="flex justify-end">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-500 flex items-center gap-2"
          >
            {showFilters ? "Filter Options" : "Show Filters"}
            <FaFilter />
          </button>
        </div>


          {showFilters && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md shadow-md">
              {/* Filter by Year */}
              <div className="mb-2">
                <label className="text-gray-700 font-semibold">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border px-3 py-2 rounded-md bg-white text-black shadow-sm focus:ring-2 focus:ring-[#C0E888] focus:border-[#C0E888] transition w-full"
                >
                  <option value="All">All Years</option>
                  {Array.from(new Set(projects.map((p) => new Date(p.created_at).getFullYear()))).map(
                    (year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Filter by Month */}
              <div className="mb-2">
                <label className="text-gray-700 font-semibold">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border px-3 py-2 rounded-md bg-white text-black shadow-sm focus:ring-2 focus:ring-[#C0E888] focus:border-[#C0E888] transition w-full"
                >
                  <option value="All">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month.toString().padStart(2, '0')}>
                      {new Date(0, month - 1).toLocaleString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="mb-2">
                <label className="text-gray-700 font-semibold">Date Range:</label>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-gray-600 font-medium">From:</label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                      className="border px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-[#C0E888] focus:border-[#C0E888] transition w-full"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600 font-medium">To:</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                      className="border px-3 py-2 rounded-md shadow-sm focus:ring-2 focus:ring-[#C0E888] focus:border-[#C0E888] transition w-full"
                    />
                  </div>
                </div>
              </div>
              
            </div>
          )}
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/project/${project.id}`)}
              className="cursor-pointer flex items-start gap-4 bg-white border-2 p-4 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-[#C0E888] hover:translate-x-2"
            >
              {/* Project Image */}
              <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden">
                <Image
                  src={projectImages[project.id] || "/placeholder.png"}
                  alt={`Project ${project.name}`}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>

              {/* Project Info */}
              <div className="flex-1">
                <h3 className="font-bold text-ms text-gray-800">{project.name}</h3>
                <p className="text-sm text-gray-500">{project.description}</p>

                {/* Date & Time Display */}
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1 bg-[#d7efb6] text-black text-[14px] px-3 py-1 rounded-full shadow-sm">
                    {new Date(project.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1 bg-[#d7efb6] text-black text-[14px] px-3 py-1 rounded-full shadow-sm">

                    {new Date(project.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
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

        {/* Date & Time Display */}
        <div className="flex gap-4">
          <span className="flex items-center gap-1 bg-[#d7efb6] text-black text-sm px-3 py-1 rounded-full shadow-sm"> 
            {new Date(project.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1 bg-[#d7efb6] text-black text-sm px-3 py-1 rounded-full shadow-sm">
            {new Date(project.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </span>
        </div>
      </div>
    );
  }

  // Show Add Project Component when isAddingProject is true
  if (isAddingProject) {
    return <AddProject isOpen={isAddingProject} onClose={() => setIsAddingProject(false)} />;
  }

  return null;
};

export default withAuth(ProjectList);
