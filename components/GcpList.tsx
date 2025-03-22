//components/GcpList.tsx
'use client';

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import PickerPopup from "./ui/PickerPopup";
import AutoDetectGcpPopup from "./ui/AutoDetectGcpPopup";

interface Gcp {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  coordinateSystem: string;
}

interface ImageData {
  file_id: string;
  file_name: string;
  imageUrl: string;
}

interface GcpListProps {
  projectId: string;
  coordinateSystem?: string; // Defaults to EPSG:4326 if not provided
}

const GcpList: React.FC<GcpListProps> = ({
  projectId,
  coordinateSystem = "EPSG:4326",
}) => {
  // Global GCPs state (CRUD section)
  const [gcps, setGcps] = useState<Gcp[]>([]);
  const [newGcp, setNewGcp] = useState({
    name: "",
    lat: "",
    lng: "",
    altitude: "",
    coordinateSystem: coordinateSystem,
  });
  const [editingGcpId, setEditingGcpId] = useState<string | null>(null);
  const [editingGcpData, setEditingGcpData] = useState({
    name: "",
    lat: "",
    lng: "",
    altitude: "",
    coordinateSystem: coordinateSystem,
  });

  const fetchGcpList = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/gcps`);
      if (response.ok) {
        const data = await response.json();
        setGcps(data.gcps);
      } else {
        console.error("Failed to fetch GCP list");
      }
    } catch (error) {
      console.error("Error fetching GCP list:", error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchGcpList();
  }, [fetchGcpList]);

  const handleAddGcp = async () => {
    if (!newGcp.name || !newGcp.lat || !newGcp.lng || !newGcp.altitude) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      const response = await fetch(`/api/projects/${projectId}/gcps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGcp.name,
          lat: parseFloat(newGcp.lat),
          lng: parseFloat(newGcp.lng),
          altitude: parseFloat(newGcp.altitude),
          coordinateSystem: newGcp.coordinateSystem,
        }),
      });
      if (response.ok) {
        setNewGcp({
          name: "",
          lat: "",
          lng: "",
          altitude: "",
          coordinateSystem: coordinateSystem,
        });
        fetchGcpList();
      } else {
        console.error("Failed to add GCP");
      }
    } catch (error) {
      console.error("Error adding GCP:", error);
    }
    }

  const handleDeleteGcp = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this GCP?")) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/gcps`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gcpId: id }),
      });
      if (response.ok) {
        fetchGcpList();
      } else {
        console.error("Failed to delete GCP");
      }
    } catch (error) {
      console.error("Error deleting GCP:", error);
    }
  };

  const handleEditGcp = (gcp: Gcp) => {
    setEditingGcpId(gcp._id);
    setEditingGcpData({
      name: gcp.name,
      lat: gcp.lat.toString(),
      lng: gcp.lng.toString(),
      altitude: gcp.altitude.toString(),
      coordinateSystem: gcp.coordinateSystem,
    });
  };

  const handleCancelEdit = () => {
    setEditingGcpId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (
      !editingGcpData.name ||
      !editingGcpData.lat ||
      !editingGcpData.lng ||
      !editingGcpData.altitude
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      const response = await fetch(`/api/projects/${projectId}/gcps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gcpId: id,
          name: editingGcpData.name,
          lat: parseFloat(editingGcpData.lat),
          lng: parseFloat(editingGcpData.lng),
          altitude: parseFloat(editingGcpData.altitude),
          coordinateSystem: editingGcpData.coordinateSystem,
        }),
      });
      if (response.ok) {
        setEditingGcpId(null);
        fetchGcpList();
      } else {
        console.error("Failed to update GCP");
      }
    } catch (error) {
      console.error("Error updating GCP:", error);
    }
  };

  // Section: GCPs in Images
  const [images, setImages] = useState<ImageData[]>([]);
  // manualGcps: key = file_id, value = array of picks
  const [manualGcps, setManualGcps] = useState<Record<string, { gcpId: string; x: number; y: number }[]>>({});
  // State for the picker popup
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerImage, setPickerImage] = useState<string | null>(null);
  const [pickerFileId, setPickerFileId] = useState<string | null>(null);
  const [autoDetectPopupOpen, setAutoDetectPopupOpen] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/assets?action=list`);
      if (response.ok) {
        const data = await response.json();
        const imgs: ImageData[] = data.files
          .filter((file: { file_type: string; file_name: string; _id?: string }) => file.file_type === "image")
          .map((file: { file_type: string; file_name: string; _id?: string }) => ({
            file_id: file._id ? file._id.toString() : file.file_name,
            file_name: file.file_name,
            imageUrl: `/api/projects/${projectId}/assets?action=serve&file=${encodeURIComponent(
              file.file_name
            )}&size=small`,
          }));
        setImages(imgs);
      } else {
        console.error("Failed to fetch images");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Open picker popup for an image
  const openPicker = (fileId: string, imageUrl: string) => {
    setPickerFileId(fileId);
    // Change size=small to size=normal for a larger view
    setPickerImage(imageUrl.replace("size=small", "size=normal"));
    setPickerOpen(true);
  };

  
  // Extract the manual picks fetching logic into a function
  const fetchManualPicksForFile = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/gcps/picker?file_id=${encodeURIComponent(fileId)}`
      );
      if (res.ok) {
        const data = await res.json();
        const picks = data.gcps_in_images.map(
          (doc: { _id: string; gcp_id: string; x: number; y: number }) => ({
            gcpId: doc.gcp_id,
            x: doc.x,
            y: doc.y,
            _id: doc._id,
          })
        );
        setManualGcps((prev) => ({
          ...prev,
          [fileId]: picks,
        }));
      } else {
        console.error("Failed to fetch GCP marks for image");
      }
    } catch (error) {
      console.error("Error fetching GCP marks for image:", error);
    }
  }, [projectId]);

  useEffect(() => {
    if (images.length > 0) {
      images.forEach((img) => {
        fetchManualPicksForFile(img.file_id);
      });
    }
  }, [images, fetchManualPicksForFile]);

  // When the picker popup is closed, fetch the manual picks for that file
  useEffect(() => {
    if (!pickerOpen && pickerFileId) {
      fetchManualPicksForFile(pickerFileId);
    }
  }, [pickerOpen, pickerFileId, projectId, fetchManualPicksForFile]);

  return (
    <div className="space-y-6">
      {/* Global GCPs Section */}
      <div className="py-2">
      <h3 className="text-lg font-semibold pb-4">GCP Lists</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-300">
          <thead>
            <tr className="bg-[#dcf1c2]">
              <th className=" p-2">Name</th>
              <th className=" p-2">Details</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gcps.map((gcp,index) => (
              <tr key={gcp._id} className={`border text-center ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                {editingGcpId === gcp._id ? (
                  <>
                    <td className=" p-2">
                      <input
                        type="text"
                        value={editingGcpData.name}
                        onChange={(e) => setEditingGcpData({ ...editingGcpData, name: e.target.value })}
                        className="border p-1 rounded w-full"
                      />
                    </td>
                    <td className=" p-2 text-start">
                      <div className="flex flex-col space-y-2">
                        <input
                          type="number"
                          placeholder="Latitude"
                          value={editingGcpData.lat}
                          onChange={(e) => setEditingGcpData({ ...editingGcpData, lat: e.target.value })}
                          className="border p-1 rounded w-full"
                        />
                        <input
                          type="number"
                          placeholder="Longitude"
                          value={editingGcpData.lng}
                          onChange={(e) => setEditingGcpData({ ...editingGcpData, lng: e.target.value })}
                          className="border p-1 rounded w-full"
                        />
                        <input
                          type="number"
                          placeholder="Altitude"
                          value={editingGcpData.altitude}
                          onChange={(e) => setEditingGcpData({ ...editingGcpData, altitude: e.target.value })}
                          className="border p-1 rounded w-full"
                        />
                        <select
                          value={newGcp.coordinateSystem}
                          onChange={(e) => setNewGcp({ ...newGcp, coordinateSystem: e.target.value })}
                          className="p-2 border rounded w-full"
                        >
                          <option value="EPSG:4326">EPSG:4326</option>
                          <option value="EPSG:32647">EPSG:32647</option>
                        </select>
                      </div>
                    </td>

                    <td className=" p-2 text-center">
                      <div className="flex flex-col space-y-4">
                        <button onClick={() => handleSaveEdit(gcp._id)} className="text-green-600 p-1 hover:rounded-lg hover:border-2 hover:font-semibold hover:border-green-600">Save</button>
                        <button onClick={handleCancelEdit} className="text-black p-1 hover:rounded-lg hover:border-2 hover:font-semibold hover:border-black">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className=" p-2 font-semibold "><span className="">{gcp.name}</span></td>
                    <td className="p-2 text-start">
                      <div className="flex flex-col gap-y-2">
                        <span className="font-medium">
                        Lat: <span className="px-2 bg-blue-100 rounded-full text-blue-600 w-fit">{gcp.lat}</span>
                        </span>
                        <span className="font-medium">
                        Long: <span className=" px-2 bg-green-100 rounded-full text-green-600 w-fit"> {gcp.lng}</span>
                        </span>
                        <span className="font-medium">Alt: <span className="px-2 bg-red-100 rounded-full text-red-600 w-fit">{gcp.altitude}m</span></span>
                        <span className="font-medium">{gcp.coordinateSystem}</span>
                      </div>
                    </td>
                    <td className=" p-2 text-center">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleEditGcp(gcp)}
                          className="bg-[#C0E888] text-black px-2 py-1 rounded-lg shadow-md hover:bg-[#A0D060] transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGcp(gcp._id)}
                          className="bg-black text-white px-2 py-1 rounded-lg shadow-md hover:bg-gray-800 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>

                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold mt-6">Add New GCP</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-300 mt-2">
          <thead>
            <tr className="bg-[#dcf1c2]">
              <th className="p-2">Name</th>
              <th className="p-2">Details</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border text-center">
              <td className="border p-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newGcp.name}
                  onChange={(e) => setNewGcp({ ...newGcp, name: e.target.value })}
                  className="p-2 border rounded w-full"
                />
              </td>
              <td className="border p-2 text-start">
                <div className="flex flex-col space-y-2">
                <input
                  type="number"
                  placeholder="Latitude"
                  value={newGcp.lat}
                  onChange={(e) => setNewGcp({ ...newGcp, lat: e.target.value })}
                  className="p-2 border rounded w-full"
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  value={newGcp.lng}
                  onChange={(e) => setNewGcp({ ...newGcp, lng: e.target.value })}
                  className="p-2 border rounded w-full"
                />
                <input
                  type="number"
                  placeholder="Altitude"
                  value={newGcp.altitude}
                  onChange={(e) => setNewGcp({ ...newGcp, altitude: e.target.value })}
                  className="p-2 border rounded w-full"
                />
                  <select
                    value={newGcp.coordinateSystem}
                    onChange={(e) => setNewGcp({ ...newGcp, coordinateSystem: e.target.value })}
                    className="p-2 border rounded w-full"
                  >
                    <option value="EPSG:4326">EPSG:4326</option>
                    <option value="EPSG:32647">EPSG:32647</option>
                  </select>
                </div>
              </td>
              <td className="border p-2">
                <button onClick={handleAddGcp} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700">+Add</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


      {/* GCPs in Images Section */}
      <div className="p-4 bg-white rounded-lgs mt-6">
        <h2 className="text-xl font-bold mb-2">GCPs in Images</h2>
        <div className="flex flex-col justify-between items-start mb-4">
           <button
           onClick = {() => setAutoDetectPopupOpen(true)}
            className="px-4 py-2 bg-black hover:bg-gray-700  text-white rounded-lg font-semibold"
          >
            Auto Detect
          </button>


        {autoDetectPopupOpen && (
            <AutoDetectGcpPopup
            isOpen={autoDetectPopupOpen}
            onClose={() => {
                setAutoDetectPopupOpen(false);
                // Optionally, re-fetch manual picks here
                if (pickerFileId) {
                    fetchManualPicksForFile(pickerFileId);
                  }
            }}
            projectId={projectId}
            />
        )}
        </div>




        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Image</th>
                <th className="border p-2">GCPs</th>
              </tr>
            </thead>
            <tbody>
              {images.length > 0 ? (
                images.map((img) => (
                  <tr key={img.file_id}>
                    <td className="border p-3 text-center">
                      <Image
                        src={img.imageUrl}
                        alt={img.file_name}
                        width={100}
                        height={100}
                        className="object-cover rounded items-center"
                      />
                      <div className="text-xs text-gray-600 mt-1">{img.file_name}</div>
                    </td>
                    <td className="border p-2">
                      {manualGcps[img.file_id] && manualGcps[img.file_id].length > 0 ? (
                        <ul className="space-y-1">
                          {manualGcps[img.file_id].map((pick, idx) => {
                            const gcp = gcps.find((g) => g._id === pick.gcpId);
                            return (
                              <li key={idx} className="text-xs">
                                {gcp ? gcp.name : pick.gcpId}
                              </li>
                            );
                          })}
                          
                        </ul>
                      ) : (
                        <span className="text-xs text-gray-400">No GCPs marked</span>
                      )}
                                            <button
                        onClick={() => openPicker(img.file_id, img.imageUrl)}
                        className="px-3 py-1 text-black font-medium rounded bg-[#C0E888] hover:bg-[#a4db57] text-xs ml-2"
                      >
                        Pick GCP
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 p-2">
                    No images found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Picker Popup */}
      <PickerPopup
        isOpen={pickerOpen}
        projectId={projectId}
        imageUrl={pickerImage || ""}
        fileId={pickerFileId || ""}
        globalGcps={gcps}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
};

export default GcpList;
