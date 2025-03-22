'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect,useCallback } from "react";
import {  FiPlus, FiLayers,FiEdit, FiTrash, FiCopy,FiChevronUp,FiChevronDown,FiEye,FiEyeOff } from "react-icons/fi";
import { polygonOverlayService,PolygonData } from '@/services/polygonOverlayService';
import { FaRegCopy } from "react-icons/fa6";
import { addTempMarker,setSelectedLayerInMap } from "./Map";


interface Layer {
  _id: string;
  name: string;
  color: string;
}

interface Polygon {
  _id: string;
  name: string;
  layerId: string;
  layer_id: string;
  color: string;
  coordinates: [number, number][];  // Add coordinates
}

const PolygonToolbox: React.FC<{ isOpen: boolean; onClose: () => void; projectId: string }> = ({ isOpen, projectId }) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [polygons, setPolygons] = useState<Record<string, Polygon[]>>({});
  //const [selectedCopyLayer, setSelectedCopyLayer] = useState<string | null>(null);
  const [newLayerName, setNewLayerName] = useState("");
  const [newLayerColor, setNewLayerColor] = useState("#FF5733");

  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editLayerName, setEditLayerName] = useState<string>("");
  const [editLayerColor, setEditLayerColor] = useState<string>("");

  const [activePolygon, setActivePolygon] = useState<string | null>(null);

// Function to start editing mode
const startEditingLayer = (layerId: string, currentName: string, currentColor: string) => {
    setEditingLayerId(layerId);
    setEditLayerName(currentName);
    setEditLayerColor(currentColor);
};

// Function to submit the changes
const submitLayerUpdate = async (layerId: string) => {
    try {
        const response = await fetch(`/api/projects/${projectId}/layer`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layer_id: layerId, name: editLayerName, color: editLayerColor }),
        });

        if (!response.ok) throw new Error("Failed to update layer");

        setLayers((prev) =>
            prev.map((layer) =>
                layer._id === layerId ? { ...layer, name: editLayerName, color: editLayerColor } : layer
            )
        );

        setEditingLayerId(null); // Exit edit mode after submitting
    } catch (error) {
        console.error("Error updating layer:", error);
    }
};

 // 🔹 Fetch layers from MongoDB
 useEffect(() => {
  const fetchLayers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/layer`);
      if (!response.ok) throw new Error("Failed to fetch layers");

      const data: Layer[] = await response.json();
      setLayers(data.map((layer) => ({ ...layer, _id: String(layer._id) })));
    } catch (error) {
      console.error("Error fetching layers:", error);
    }
  };

    if (isOpen) fetchLayers();
  }, [isOpen, projectId]);

  // 🔹 Fetch polygons when expanding
  const fetchPolygons = useCallback(async (layerId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/polygon?layer_id=${layerId}`);
      if (!response.ok) throw new Error("Failed to fetch polygons");

      const loadedPolygons: PolygonData[] = await response.json();
      const transformedPolygons: Polygon[] = loadedPolygons.map((polygon) => ({
        _id: polygon._id,
        name: polygon.name,
        layerId,
        layer_id: polygon.layer_id,
        color: polygon.color,
        coordinates: polygon.coordinates,
      }));

      setPolygons((prev) => ({ ...prev, [layerId]: transformedPolygons }));
      
      // Ensure visibility toggle is respected
      if (visibleLayers[layerId]) {
        polygonOverlayService.setPolygons(layerId, transformedPolygons);
      }
    } catch (error) {
      console.error("Error fetching polygons:", error);
    }
  }, [projectId, visibleLayers]);

  // 🔹 Expand/collapse layers but DO NOT affect visibility
  const toggleLayerExpansion = (layerId: string) => {
    setExpandedLayers((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));

    if (!polygons[layerId] || polygons[layerId].length === 0) {
      fetchPolygons(layerId);
    }
  };

  // 🔹 Toggle visibility of polygons
  const toggleVisibility = (layerId: string) => {
    // Check if polygons were fetched (i.e., layer was expanded once)
    if (!polygons[layerId] || polygons[layerId].length === 0) {
      alert("Please fetch polygons first before toggling visibility.");
      return;
    }
  
    const isVisible = visibleLayers[layerId] ?? true;
    setVisibleLayers((prev) => ({ ...prev, [layerId]: !isVisible }));
  
    if (isVisible) {
      polygonOverlayService.setPolygons(layerId, []); // Hide polygons by setting an empty array
    } else {
      polygonOverlayService.setPolygons(layerId, polygons[layerId] || []); // Show polygons if they exist
    }
  };

      
    // 🔹 Add a new layer (Now includes name & color input)
    const addLayer = async () => {
        if (!newLayerName.trim()) return alert("Layer name is required.");
        if (!newLayerColor.trim()) return alert("Layer color is required.");
    
        try {
        const response = await fetch(`/api/projects/${projectId}/layer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newLayerName, color: newLayerColor }),
        });
    
        if (!response.ok) throw new Error("Failed to add layer");
    
        const newLayer: Layer = await response.json();
        setLayers((prev) => [...prev, newLayer]);
        setNewLayerName("");
        setNewLayerColor("#FF5733"); // Reset to default color after adding
        } catch (error) {
        console.error("Error adding layer:", error);
        }
    };

    const deleteLayer = async (layerId: string) => {
      const confirmDelete = typeof window !== 'undefined' && window.confirm("Are you sure you want to delete this layer?");
      if (!confirmDelete) return; // Exit if user cancels

        try {
            const response = await fetch(`/api/projects/${projectId}/layer`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ layer_id: layerId }),
            });

            if (!response.ok) throw new Error("Failed to delete layer");

            setLayers((prev) => prev.filter((layer) => layer._id !== layerId));

            // Correctly remove all polygons under this layer
            setPolygons((prev) => {
                const updatedPolygons = { ...prev };
                delete updatedPolygons[layerId]; // Remove layer key from polygons object
                return updatedPolygons;
            });

            // Re-fetch polygons from the server for this layer
            await polygonOverlayService.loadPolygons(projectId, layerId);
            // Emit event so toolbox refetches too
            polygonOverlayService.emit("polygonCreated", { layerId });

            if (selectedLayer === layerId) setSelectedLayer(null);
        } catch (error) {
            console.error("Error deleting layer:", error);
            alert("Error deleting layer. Check console for details.");
        }
    };


    const copyPolygonFromMaster = async () => {
        if (!selectedLayer) {
        return alert("Please select a layer before copying from master.");
        }
    
        try {
        const response = await fetch(`/api/projects/${projectId}/polygon`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layer_id: selectedLayer, copy_from_master: true }),
        });
    
        const responseData: Polygon[] = await response.json();
    
        if (!response.ok) throw new Error("Failed to copy polygons from master");
    
        // Append multiple polygons correctly in the object state
        setPolygons((prev) => ({
            ...prev,
            [selectedLayer]: [...(prev[selectedLayer] || []), ...responseData], // Append polygons under correct layer
        }));
    
        alert(`Successfully copied ${responseData.length} polygons from the master dataset.`);
        } catch (error) {
        console.error("Error copying polygons from master:", error);
        alert("Error copying polygons from master. Check console for details.");
        }
    };
    
    const copyPolygonAsNewLayer = async (sourceLayerId: string) => {
      if (!sourceLayerId) {
          alert("Please select a source layer to copy from.");
          return;
      }
  
      // Step 1: Determine the New Layer Name
      const baseName = "Copy";
      let copyNumber = 1;
      
      // Find existing copies and get the highest number
      const copyLayers = layers.filter(layer => layer.name.startsWith(baseName));
      if (copyLayers.length > 0) {
          const copyNumbers = copyLayers
              .map(layer => {
                  const match = layer.name.match(/\((\d+)\)$/); // Extract number from "Copy (X)"
                  return match ? parseInt(match[1], 10) : 0;
              })
              .filter(num => num > 0);
  
          if (copyNumbers.length > 0) {
              copyNumber = Math.max(...copyNumbers) + 1; // Next available copy number
          }
      }
  
      const newLayerName = `${baseName} (${copyNumber})`;
  
      // Step 2: Create a New Layer
      try {
          const newLayerResponse = await fetch(`/api/projects/${projectId}/layer`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: newLayerName, color: "#C0E888" }), // Default color
          });
  
          if (!newLayerResponse.ok) throw new Error("Failed to create new layer");
  
          const newLayer: Layer = await newLayerResponse.json();
  
          // Step 3: Copy Polygons from the Source Layer to the New Layer
          const response = await fetch(`/api/projects/${projectId}/polygon`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ layer_id: newLayer._id, copy_from_layer: sourceLayerId }),
          });
  
          if (!response.ok) throw new Error("Failed to copy polygon from another layer");
  
          const newPolygons: Polygon[] = await response.json();
  
          // Step 4: Update UI State
          setLayers((prevLayers) => [...prevLayers, newLayer]); // Add new layer to state
          polygonOverlayService.setPolygons(newLayer._id, newPolygons); // Update map polygons
  
          alert(`Successfully copied ${newPolygons.length} polygons into a new layer: "${newLayer.name}"`);
      } catch (error) {
          console.error("Error copying polygons into a new layer:", error);
      }
    };
    
    const updatePolygonName = async (_id: string, layerId: string, currentName: string) => {
        const newName = prompt("Enter new name for the polygon:", currentName);
        if (!newName || newName.trim() === "") return;

        try {
            const response = await fetch(`/api/projects/${projectId}/polygon`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ polygon_id: _id, name: newName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update polygon name");
            }

            setPolygons((prev) => ({
                ...prev,
                [layerId]: prev[layerId].map((polygon) =>
                    polygon._id === _id ? { ...polygon, name: newName } : polygon
                ),
            }));

            // Re-fetch polygons from the server for this layer
            await polygonOverlayService.loadPolygons(projectId, layerId);
            // Emit event so toolbox refetches too
            polygonOverlayService.emit("polygonCreated", { layerId });

        } catch (error) {
            console.error("Error updating polygon name:", error);
            alert("Failed to update polygon name. Check console for details.");
        }
    };

    const deletePolygon = async (_id: string, layerId: string) => {
      const confirmDelete = typeof window !== 'undefined' && window.confirm("Are you sure you want to delete this polygon?");
      if (!confirmDelete) return; 
      
      try {
        const response = await fetch(`/api/projects/${projectId}/polygon`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polygon_id: _id }),
        });
        
        if (!response.ok) throw new Error("Failed to delete polygon");
        
        // Re-fetch polygons from the server for this layer
        await polygonOverlayService.loadPolygons(projectId, layerId);
        // Emit event so toolbox refetches too
        polygonOverlayService.emit("polygonCreated", { layerId });
        
      } catch (error) {
        console.error("Error deleting polygon:", error);
      }
    };
    
    

      const handlePolygonClick = (polygon: Polygon) => {
        if (polygon.coordinates.length > 0) {
          // Calculate the average latitude and longitude
          const avgCoord = polygon.coordinates.reduce(
            (acc, coord) => {
              acc[0] += coord[0];
              acc[1] += coord[1];
              return acc;
            },
            [0, 0] as [number, number]
          );
      
          avgCoord[0] /= polygon.coordinates.length;
          avgCoord[1] /= polygon.coordinates.length;
      
          // Add a temporary 🚩 marker at the center of the polygon
          addTempMarker(avgCoord, polygon.name);
        } else {
          alert("No coordinates found for this polygon.");
        }
      };

      const handleLayerClick = (layerId: string, color: string) => {
        setSelectedLayer(layerId);
      
        if (setSelectedLayerInMap) {
          setSelectedLayerInMap(layerId, projectId, color);  // 🔥 Send all three values
        }
      };

      useEffect(() => {
        const handlePolygonCreated = (payload: unknown) => {
          const { layerId } = payload as { layerId: string; polygon?: Polygon };
          fetchPolygons(layerId);
        };
        polygonOverlayService.addEventListener("polygonCreated", handlePolygonCreated);
        return () => {
          polygonOverlayService.removeEventListener("polygonCreated", handlePolygonCreated);
        };
      }, [fetchPolygons]);
            
  if (!isOpen) return null;

  return (
    <div className="w-full bg-white shadow-lg p-4 z-50 border-l overflow-auto rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold flex items-center gap-x-1"><FiLayers />Layers</h3>
      </div>

      {/* Add New Layer Section */} 
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full max-w-md bg-white shadow mb-2">
        
        {/* Color Picker Circle */}
        <div className="flex items-center justify-center h-8 w-8 p-1">
          <div
            className="h-4 w-4 rounded-full overflow-hidden flex items-center justify-center border border-gray-300"
            style={{
              boxShadow: "0 0 3px rgba(0, 0, 0, 0.2)", // Adds depth
            }}
          >
            <input
              type="color"
              value={newLayerColor}
              onChange={(e) => setNewLayerColor(e.target.value)}
              className="h-12 w-12 cursor-pointer border-none p-0"
              style={{
                transform: "scale(1.5)", // Expands the color picker inside to fully cover the circle
                borderRadius: "50%", // Ensures a perfect round shape
                appearance: "none",
                background: "transparent",
              }}
            />
          </div>
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          placeholder="Enter layer name"
          className="flex-1 px-3 py-2 outline-none text-sm border-l border-gray-300 text-gray-600"
        />

        {/* Add Layer Button (Fixed) */}
        <button
          onClick={addLayer}
          className="
            bg-gray-800 
            text-white 
            px-3 
            py-3 
            flex 
            items-center 
            gap-2 
            hover:bg-[#73C400]
            text-sm
            font-semibold
            rounded-r-md
            flex-shrink-0  
            w-auto          
          "
        >
          <FiPlus />
          
        </button>

      </div>

      {/* Layer List */}
      <div className="h-fit mb-2 border rounded-lg p-2 border-gray-300">
        {layers.map((layer) => (
          <div key={layer._id} className="mb-2">
            {/* Layer Item */}
            <div 
              className="flex items-center px-3 py-2 rounded-lg shadow-sm border border-[#C0E888] bg-white hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleLayerExpansion(layer._id)}
            >
              {/* Left Section: Selection & Layer Info */}
              <div className="flex items-center gap-2 flex-1">
                {/* Selected Layer Indicator */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleLayerClick(layer._id, layer.color) }}
                  className={`w-6 h-6 flex items-center justify-center rounded-full border-2 
                    ${selectedLayer === layer._id ? 'border-blue-500 bg-blue-200' : 'border-gray-400 bg-gray-100'} 
                    hover:border-blue-600 hover:bg-blue-300`}
                  title="Set as Selected Layer"
                >
                  {selectedLayer === layer._id && <span className="w-3 h-3 bg-blue-500 rounded-full"></span>}
                </button>

                {/* Layer Color */}
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }}></span>

                {/* If in Edit Mode, Show Inputs */}
                {editingLayerId === layer._id ? (
                  <div className="flex items-center gap-2">
                    {/* Text Input for Layer Name */}
                    <input
                      type="text"
                      value={editLayerName}
                      onChange={(e) => setEditLayerName(e.target.value)}
                      className="px-1 py-1 border rounded-md text-sm w-24"
                    />

                    {/* Color Picker */}
                    <div className="flex items-center justify-center h-7 w-7">
                      <div
                        className="h-4 w-4 rounded-full overflow-hidden flex items-center justify-center border border-gray-300"
                        style={{
                          boxShadow: "0 0 3px rgba(0, 0, 0, 0.2)", // Adds depth
                        }}
                      >
                        <input
                          type="color"
                          value={newLayerColor}
                          onChange={(e) => setEditLayerColor(e.target.value)}
                          className="h-6 w-6 cursor-pointer border-none p-0"
                          style={{
                            transform: "scale(1.5)", // Expands the color picker inside to fully cover the circle
                            borderRadius: "50%", // Ensures a perfect round shape
                            appearance: "none",
                            background: "transparent",
                          }}
                        />
                      </div>
                    </div>


                    {/* Save Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); submitLayerUpdate(layer._id); }}
                      className="px-[7px] py-1 text-sm bg-[#73C400] text-white rounded-md hover:bg-green-600"
                    >
                      Save
                    </button>

                    
                  </div>
                ) : (
                  // Normal Display Mode
                  <span className="text-sm font-medium">{layer.name}</span>
                )}
              </div>

              {/* Right Section: Actions (Visibility, Edit, Delete, Copy) */}
              {editingLayerId !== layer._id && (
          <div className="flex items-center gap-2 ml-auto">
      {/* Visibility Toggle */}
      <button 
        onClick={(e) => { e.stopPropagation(); toggleVisibility(layer._id); }} 
        className="hover:text-gray-600"
        title="Toggle Visibility"
      >
        {visibleLayers[layer._id] ? <FiEye size={16} /> : <FiEyeOff size={16} />}
      </button>

    {/* Edit Button */}
    <button 
      onClick={(e) => { e.stopPropagation(); startEditingLayer(layer._id, layer.name, layer.color); }} 
      className="hover:text-yellow-500"
      title="Edit Layer"
    >
      <FiEdit size={16} />
    </button>

    {/* Delete */}
    <button 
      onClick={(e) => { e.stopPropagation(); deleteLayer(layer._id); }} 
      className="hover:text-red-500"
      title="Delete Layer"
    >
      <FiTrash size={16} />
    </button>

    {/* Copy as New Layer */}
    <button 
      onClick={(e) => { e.stopPropagation(); copyPolygonAsNewLayer(layer._id); }} 
      className="hover:text-blue-500"
      title="Copy Layer"
    >
      <FaRegCopy size={16} />
    </button>

    {/* Expand/Collapse Layer */}
    <button className="hover:text-gray-600" title="Expand/Collapse">
      {expandedLayers[layer._id] ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
    </button>
  </div>
)}

            </div>

            {/* Polygons in Layer */}
            {expandedLayers[layer._id] && (
              <div className="ml-6 mt-2 border-l pl-3">
                {polygons[layer._id]?.map((polygon) => (
                  <div 
                    key={`${layer._id}-${polygon._id}`} 
                    className="flex justify-between items-center p-1"
                  >
                    {/* Clickable Name */}
                    <span 
                      className={`cursor-pointer hover:underline ${activePolygon === polygon._id ? 'text-blue-800 font-semibold' : ''}`}
                      onClick={() => {
                        setActivePolygon(polygon._id);
                        handlePolygonClick(polygon); // Send the full polygon data
                        setTimeout(() => setActivePolygon(null), 3000); // Reset after 3 seconds
                      }}
                    >
                      {polygon.name}
                    </span>
                    
                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updatePolygonName(polygon._id, layer._id, polygon.name)} 
                        className="text-yellow-500 hover:text-yellow-600"
                        title="Edit Polygon"
                      >
                        <FiEdit />
                      </button>
                      <button 
                        onClick={() => deletePolygon(polygon._id, layer._id)} 
                        className="text-red-500 hover:text-red-600"
                        title="Delete Polygon"
                      >
                        <FiTrash />
                      </button>
                    </div>
                  </div>
                ))}

              </div>
            )}

          </div>
        ))}
      </div>

      {/* Copy Options*/} 
      <div className="mb-2">
        <button onClick={copyPolygonFromMaster} className="w-full bg-gray-800 text-white py-1 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-900 text-sm">
          <FiCopy /> Copy from Master
        </button>
      </div>
      
    </div>
  );
};

export default PolygonToolbox;
