'use client';

export const dynamic = 'force-dynamic';

/* eslint-disable @typescript-eslint/no-explicit-any */
import withAuth from "@/hoc/withAuth";
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import ImageGrid from '@/components/ImageGrid';
import GcpList from "@/components/GcpList";
import { FiChevronDown, FiChevronUp, FiMap, FiEdit, FiTrash, FiRefreshCw } from 'react-icons/fi';
import UploadData from '@/components/UploadData';
import GenerateOrthophotoPopup from "@/components/ui/GenerateOrthophotoPopup";
import OrthoGrid from '@/components/OrthoGrid';
import { buildingOverlayService } from '@/services/buildingOverlayService';
import BuildingList from '@/components/BuildingList';
import { cameraShotsService } from '@/services/cameraShotsService';
import AutoDetectGcpPopup from "@/components/ui/AutoDetectBuildingPopup";
import DeleteBuildingButton from "@/components/ui/DeleteBuilding";

import {  AiOutlineEdit } from 'react-icons/ai';
import { FaRegCalendarAlt, FaRegImages, FaMountain, FaLayerGroup, FaUpload } from "react-icons/fa";
import { FiLoader } from "react-icons/fi"; // Import a loading spinner icon
import '../[id]/index.css';
import { HiCamera,HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { MdAccessTime } from "react-icons/md";
import {mapCenterService} from "@/services/mapCenterService";
import PolygonToolbox from "@/components/PolygonToolbox"; // Import the toolbox
import Shared from "@/components/Shared";
import { IoLocation } from "react-icons/io5";
import Head from 'next/head';
const ProjectPage = () => {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [project, setProject] = useState<Record<string, any> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshImages, setRefreshImages] = useState(0);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isGcpOpen, setIsGcpOpen] = useState(false);
  const [isOrthophotoOpen, setIsOrthophotoOpen] = useState(false);
  const [isBuildingOpen, setIsBuildingOpen] = useState(false);
  const [isGeneratePopupOpen, setIsGeneratePopupOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [center, setCenter] = useState<{ lat: string; lon: string }>({ lat: '', lon: '' });
  const [createdTime, setCreatedTime] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const [isBuildingChecked, setIsBuildingChecked] = useState(false);
  const [isShotsChecked, setIsShotsChecked] = useState(false);
  const [isPolygonToolboxOpen, setIsPolygonToolboxOpen] = useState(false);
  const [autoDetectPopupOpen, setAutoDetectPopupOpen] = useState(false);
  

  const handleGenerateClick = () => {
    setIsGeneratePopupOpen(true);
  };  

  const fetchBoundsAndUpdateMap = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/projects/${id}/assets?action=serve&file=bounds.json`
      );
      if (response.ok) {
        const bounds = await response.json();
        const center = bounds.center;

        // Update map center using mapCenterService
        mapCenterService.setCenter([center.lat, center.lon]);


      } else {
        console.warn("Failed to fetch bounds.json");
      }
    } catch (error) {
      console.warn("Error fetching bounds.json:", error);
    }
  }, [id])

  useEffect(() => {
    // Clear polygons when switching projects
    buildingOverlayService.clearPolygons();
    setIsBuildingChecked(false); // Ensure checkbox resets
    setIsLoading(true); // Show loading animation while fetching

    // Fetch project data
    const fetchProjectData = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (response.ok) {
          const foundProject = await response.json();
          setProject(foundProject);
          setName(foundProject.name);
          setDescription(foundProject.description ?? '');
          setCenter({
            lat: foundProject.center?.lat ?? '',
            lon: foundProject.center?.lon ?? ''
          });
          const createdDate = new Date(foundProject.created_at);
          setCreatedAt(
            createdDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          );
          setCreatedTime(
            createdDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          );
        } else {
          console.warn('Failed to fetch project data');
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally{
        setIsLoading(false);
      }
    };

    fetchBoundsAndUpdateMap();


    fetchProjectData();

  }, [id, fetchBoundsAndUpdateMap]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Project deleted successfully.');
      } else {
        console.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleteConfirmOpen(false);
      router.push('/project/list');
      router.refresh();
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setIsEditing(false);
        router.refresh();
      } else {
        console.error('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleBuildingToggle = async () => {
    const newChecked = !isBuildingChecked;
    setIsBuildingChecked(newChecked);
  
    if (newChecked) {
      // Delegate fetching to the service
      const res = await buildingOverlayService.loadPolygons(id);
      if (res == 404) {
        alert('Failed to load building footprints');
        buildingOverlayService.clearPolygons();
        setIsBuildingChecked(false);
      }
    } else{
      buildingOverlayService.clearPolygons();
    }
  };

  const handleShotsToggle = async () => {
    const newChecked = !isShotsChecked;
    setIsShotsChecked(newChecked);
  
    if (newChecked) {
      try {
        // Load shots from the service
        await cameraShotsService.loadShotsFromApi(id);
      } catch (error) {
        console.error("Failed to load camera shots:", error);
        alert("Failed to load camera shots.");
        setIsShotsChecked(false);
      }
    } else {
      // Clear shots when toggled off
      cameraShotsService.clearShots();
    }
  };

  // Show loading animation while fetching
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FiLoader className="animate-spin text-4xl text-green-500" />
        <p className="ml-2 text-lg font-semibold text-gray-600">Loading project...</p>
      </div>
    );
  }

  // Show error message if project is not found after loading
  if (!isLoading && !project) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-lg font-semibold text-red-500">Project not found!</p>
      </div>
    );
  }

  return (
    <div className="p-4 relative scrollbar">
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {isEditing ? (
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Edit Project</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              placeholder="Enter project name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="text"
              value={center.lat}
              onChange={(e) => setCenter({ ...center, lat: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              placeholder="Enter project name"
            />
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="text"
              value={center.lon}
              onChange={(e) => setCenter({ ...center, lon: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              placeholder="Enter project name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
              rows={4}
              placeholder="Enter project description"
            />
          </div>
          <button
            onClick={handleSubmit}
            className=" bg-[#C0E888] text-black hover:text-white px-4 py-2 rounded-lg shadow-md hover:bg-black transition-colors flex items-center gap-2"
          >
            <FiEdit className="text-lg" />
            Submit
          </button>
        </div>
      ) : (
        <div>
          <div className='flex items-center'>
            <h1 className="text-2xl font-bold mb-4">{project?.name}</h1>
            <button
                onClick={handleEditClick}
                className="flex items-center"
              >
                <AiOutlineEdit className='ml-4 text-gray-500 hover:text-[#000000]'/>
            </button>

            {/* 
            <button 
            onClick={handleLocationClick}
            className="ml-4 text-2xl text-gray-500 hover:text-[#000000]">
                <CiLocationOn  />
            </button>
            */}
          </div>

          <div className="flex gap-4">
              <span className="flex items-center gap-1 bg-[#d7efb6] text-black text-sm px-3 py-1 rounded-full shadow-sm">
                <FaRegCalendarAlt /> 
                {createdAt}
              </span>
              <span className="flex items-center gap-1 bg-[#c3f5f6] text-black text-sm px-3 py-1 rounded-full shadow-sm">
                <MdAccessTime className='text-[20px]'/>
                {createdTime}
              </span>
            </div>
             
            {/* Project Description */}
            <div className='mt-4'>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsDescriptionOpen((prev) => !prev)}
            >
              <div className="flex items-center gap-2 w-screen hover:bg-[#C0E888] px-4 py-2 rounded-lg hover:translate-x-2 transition-transform duration-300">
                <FiMap className="text-[19px] text-black" />
                <p className="text-lg font-medium text-black">Project Description</p>
              </div>
              {isDescriptionOpen ? (
                <FiChevronUp className="absolute right-5 text-lg text-black" />
              ) : (
                <FiChevronDown className="absolute right-5 text-lg text-black" />
              )}
            </div>
              {isDescriptionOpen && (
                <div className="mt-4 bg-gray-100 rounded-lg border ">
                  <div className="w-full bg-white p-4 border-l rounded-lg">
                    <p className="text-base text-gray-700">{project?.description}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Images */}
            <div className="mt-4">
              <div
                className="flex items-center justify-between cursor-pointer "
                onClick={() => setIsImageOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-2 w-screen  hover:bg-[#C0E888] px-4 py-2 rounded-lg hover:translate-x-2 transition-transform duration-300">
                  <FaRegImages className="text-lg text-black mt-0.5" />
                  <p className="text-lg font-medium text-black">Images</p>
                </div>
                {isImageOpen ? (
                  <FiChevronUp className="absolute right-5 text-lg text-black" />
                ) : (
                  <FiChevronDown className="absolute right-5 text-lg text-black" />
                )}
              </div>

              {/* Collapsible Content */}
              {isImageOpen && (
                <div className="mt-4 bg-gray-100 rounded-lg p-4 border">
                  <div className="w-full bg-white shadow-lg p-4 border-l rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      <ImageGrid
                        projectId={id}
                        setCenter={() => {}}
                        refresh={refreshImages}  
                      />
                    </div>
                    <div className="bg-white rounded-lg  max-w-sm mx-auto mt-8">
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center justify-center gap-4 bg-gray-800 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition-all w-full text-center mb-4 hover:bg-gray-700"
                      >
                        <FaUpload className=""/>Upload Images
                      </button>
                      
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* GCPs */}
            <div className="mt-4">
              <div
                className="flex items-center justify-between cursor-pointer "
                onClick={() => setIsGcpOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-2 w-screen  hover:bg-[#C0E888] px-4 py-2 rounded-lg hover:translate-x-2 transition-transform duration-300">
                  <IoLocation className="text-lg text-black mt-0.5" />
                  <p className="text-lg font-medium text-black">Ground Control Points</p>
                </div>
                {isGcpOpen ? (
                  <FiChevronUp className="absolute right-5 text-lg text-black" />
                ) : (
                  <FiChevronDown className="absolute right-5 text-lg text-black" />
                )}
              </div>

              {/* Collapsible Content */}
              {isGcpOpen && (
                <div className="mt-4 bg-gray-100 rounded-lg p-4 border">
                  <div className="w-full bg-white shadow-lg p-4 border-l rounded-lg">
                    <GcpList projectId={id}/>
                  </div>
                </div>
              )}
            </div>

            {/* Orthophoto */}
            <div className="mt-4">
              {/* Header Section with Toggle */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsOrthophotoOpen((prev) => !prev)}
              >
                <h2 className="flex items-center gap-2 text-lg font-medium w-screen  hover:bg-[#C0E888] px-4 py-2 rounded-lg hover:translate-x-2 transition-transform duration-300">
                  <FaMountain className="mt-0" />
                  Orthophoto
                </h2>
                {isOrthophotoOpen ? (
                  <FiChevronUp className="absolute right-5 text-xl text-gray-700 " />
                ) : (
                  <FiChevronDown className="absolute right-5 text-xl text-gray-700" />
                )}
              </div>

              {/* Collapsible Content */}
              {isOrthophotoOpen && (
                <div className=" bg-gray-100 rounded-lg p-4 border">
                  <div className="w-full bg-white shadow-lg p-4 border-l rounded-lg">
                    <label className="ml-3 mt-2 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isShotsChecked}
                        onChange={handleShotsToggle}
                        className="ui-checkbox" 
                      />
                      <span className="text-gray-700 font-medium flex items-center">
                        <HiCamera className="mr-2" />
                        Camera Shots
                      </span>
                    </label>
                    <div className="px-4">
                      <OrthoGrid projectId={id} />
                      <button
                        onClick={handleGenerateClick}
                        className="bg-black justify-center mt-4 text-white w-full py-2 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 flex items-center gap-2"
                      >
                        <FiRefreshCw className="text-lg" />
                        Generate
                      </button>
                    </div>
                     {/* Generate Orthophoto Popup */}
                    <GenerateOrthophotoPopup
                      isOpen={isGeneratePopupOpen}
                      onClose={() => setIsGeneratePopupOpen(false)}
                      projectId={id}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Building Footprint */}
            <div className='mt-4'>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsBuildingOpen((prev) => !prev)}
            >
              <div className="flex items-center gap-2 w-screen hover:bg-[#C0E888] px-4 py-2 rounded-lg hover:translate-x-2 transition-transform duration-300">
                <HiOutlineBuildingOffice2 className="text-lg text-black" />
                <p className="text-lg font-medium text-black">Building</p>
              </div>
              {isBuildingOpen ? (
                <FiChevronUp className="absolute right-5 text-lg text-black" />
              ) : (
                <FiChevronDown className="absolute right-5 text-lg text-black" />
              )}
            </div>
            {isBuildingOpen && (
              <div className="mt-4 bg-gray-100 rounded-lg p-4 border ">
                <div className="w-full bg-white shadow-lg p-4 border-l rounded-lg">
                  <label className="ml-3 mt-2 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBuildingChecked}
                        onChange={handleBuildingToggle}
                        className="ui-checkbox" // Hide default checkbox UI
                      />
                      <span className="text-gray-700 font-medium flex items-center">
                        <HiOutlineBuildingOffice2 className="mr-2" />
                        Building Footprint
                      </span>
                  </label>
                  <BuildingList projectId={id} />
                  <button
                        onClick={() => setAutoDetectPopupOpen(true)}
                        className="bg-black justify-center mt-4 text-white w-full py-2 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 flex items-center gap-2"
                  >
                    <FiRefreshCw className="text-lg" />
                    Generate
                  </button>
                  <DeleteBuildingButton projectId={id} />

                  {/* Auto Detect GCP Popup */}
                  {autoDetectPopupOpen && (
                      <AutoDetectGcpPopup
                      isOpen={autoDetectPopupOpen}
                      onClose={() => {
                          setAutoDetectPopupOpen(false);

                      }}
                      projectId={id}
                      />
                  )}
                </div>
              </div>
            )}
            </div>

            {/* Polygon Toolbox */}
            <div className="mt-4 mb-6"
            >
              <div
                className="flex items-center justify-between cursor-pointer "
                onClick={() => {setIsPolygonToolboxOpen((prev) => !prev)}}
              >
                <div className="flex items-center gap-2 w-screen  hover:bg-[#C0E888] px-4 py-2 rounded-lg hover:translate-x-2 transition-transform duration-300">
                  <FaLayerGroup className=' text-black'/>
                  <p className="text-lg font-medium text-black">Polygons</p>
                </div>
                {isPolygonToolboxOpen ? (
                  <FiChevronUp className="absolute right-5 text-lg text-black" />
                  
                ) : (
                  <FiChevronDown className="absolute right-5 text-lg text-black" />
                )}
              </div>

              {/* Collapsible Content */}
              {isPolygonToolboxOpen && (
                <div className="mt-4 bg-gray-100 rounded-lg p-4 border">
                  <PolygonToolbox projectId={id} isOpen={isPolygonToolboxOpen} onClose={() => setIsPolygonToolboxOpen(false)} />
                </div>
              )}
            </div>

            <div className="mb-10">
              <Shared projectId={id} />
            </div>
            
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2 justify-center mt-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="bg-red-800 text-white px-[133px] py-2 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200  flex items-center gap-2"
              >
                <FiTrash className="text-lg" />
                Delete
              </button>
            </div>



          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                <h2 className="text-xl font-bold mb-4 text-center">Confirm Deletion</h2>
                <p className="text-gray-700 mb-6 text-center">
                  Are you sure you want to delete this project? This action cannot be undone.
                </p>
                <div className="flex justify-between">
                  <button
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="bg-gray-300 text-black px-4 py-2 rounded-lg shadow-md hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-500 transition-all"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
          {isUploadOpen && (
            <UploadData
              isOpen={isUploadOpen}
              onClose={() => {
                setIsUploadOpen(false);
                setRefreshImages(prev => prev + 1);
              }}
              projectId={id}
            />
          )}
         
        </div>
      )}
    </div>
  );
};

export default withAuth(ProjectPage);
