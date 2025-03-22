"use client";

import React, { useState, useRef, useEffect,useCallback } from "react";
import Image from "next/image";

// We extend the ManualPick interface to include the database _id (if available)
interface ManualPick {
  _id?: string;
  gcpId: string;
  x: number;
  y: number;
}

interface Gcp {
  _id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  coordinateSystem: string;
}

interface PickerPopupProps {
  isOpen: boolean;
  projectId: string;
  imageUrl: string;
  fileId: string;
  globalGcps: Gcp[];
  onClose: () => void;
}

const PickerPopup: React.FC<PickerPopupProps> = ({
  isOpen,
  projectId,
  imageUrl,
  fileId,
  globalGcps,
  onClose,
}) => {
  // --- Manual Picks & GCP selection ---
  const [manualPicks, setManualPicks] = useState<ManualPick[]>([]);
  const [selectedGcp, setSelectedGcp] = useState<Gcp | null>(null);
  const isSubmitting = useRef(false); // Prevent multiple submissions

  // store the "filename" extracted from imageUrl and display it.
  const [extractedFileName, setExtractedFileName] = useState("");
  const [croppedImages, setCroppedImages] = useState<{ [key: string]: string }>({});
  const [originalWidth, setOriginalWidth] = useState(1); // Default to avoid division by zero
  const [originalHeight, setOriginalHeight] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const [zoom, setZoom] = useState(1); // Default zoom level (1 = normal)
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number } | null>(null);

  // Extract the file name from imageUrl for display in the heading
  useEffect(() => {
    if (imageUrl) {
      try {
        const urlObj = new URL(imageUrl, window.location.origin);
        const fname = urlObj.searchParams.get("file") || "";
        setExtractedFileName(fname);

        const img = new window.Image();
        img.src = imageUrl;
        img.onload = () => {
          setOriginalWidth(img.naturalWidth);
          setOriginalHeight(img.naturalHeight);
        };

      } catch (error) {
        console.error("Error parsing imageUrl", error);
      }
    }
  }, [imageUrl]);

  // Fetch existing manual picks for the current file (only for that image) 
  useEffect(() => {
    if (!isOpen) return;

    const fetchExistingPicks = async () => {
      try {
        // Only picks for this fileId:
        const res = await fetch(
          `/api/projects/${projectId}/gcps/picker?file_id=${encodeURIComponent(fileId)}`
        );
        if (res.ok) {
          const data = await res.json();
          // data.gcps_in_images is an array of picks with _id, gcp_id, x, y, etc.
          const picks: ManualPick[] = data.gcps_in_images.map(
            (doc: { _id: string; gcp_id: string; x: number; y: number }) => ({
              _id: doc._id,
              gcpId: doc.gcp_id,
              x: doc.x,
              y: doc.y,
            })
          );
          setManualPicks(picks);
        } else {
          console.error("Failed to fetch existing picks");
        }
      } catch (error) {
        console.error("Error fetching existing picks:", error);
      }
    };

    fetchExistingPicks();
  }, [isOpen, projectId, fileId]);
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
  
    e.preventDefault(); // Prevents page scroll while zooming
  
    const rect = containerRef.current.getBoundingClientRect();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; // Scroll up to zoom in, scroll down to zoom out
    let newZoom = zoom * zoomFactor;
    newZoom = Math.max(1, Math.min(10, newZoom)); // Clamp zoom between 1x and 10x
  
    // Get current center in image coordinates
    const centerX = (rect.width / 2 - offsetX) / zoom;
    const centerY = (rect.height / 2 - offsetY) / zoom;
  
    // Calculate new offset so the container's center remains fixed
    let newOffsetX = rect.width / 2 - centerX * newZoom;
    let newOffsetY = rect.height / 2 - centerY * newZoom;
  
    // --- New Clamping Code ---
    // If newZoom is 1, reset offsets to 0 (no panning allowed)
    if (newZoom === 1) {
      newOffsetX = 0;
      newOffsetY = 0;
    } else {
      // Calculate displayed image dimensions at the new zoom level.
      const displayedWidth = originalWidth * newZoom;
      const displayedHeight = originalHeight * newZoom;
  
      // Determine container center and image half dimensions.
      const halfContainerWidth = rect.width / 2;
      const halfContainerHeight = rect.height / 2;
      const halfImageWidth = displayedWidth / 2;
      const halfImageHeight = displayedHeight / 2;
  
      // Compute maximum allowed offsets.
      const maxPanX = Math.max(0, halfImageWidth - halfContainerWidth);
      const maxPanY = Math.max(0, halfImageHeight - halfContainerHeight);
  
      // Clamp offsets so that the image always fills the container.
      newOffsetX = Math.max(-maxPanX, Math.min(newOffsetX, maxPanX));
      newOffsetY = Math.max(-maxPanY, Math.min(newOffsetY, maxPanY));
    }
    // --- End Clamping Code ---
  
    setZoom(newZoom);
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disable panning if not zoomed in
    if (zoom === 1) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  const handleMouseMovePan = (e: React.MouseEvent<HTMLDivElement>) => {
    // If not panning or if zoom is 1, don't adjust offsets.
    if (zoom === 1 || !isPanning || !startPan || !containerRef.current) return;
  
    const rect = containerRef.current.getBoundingClientRect();
  
    // Calculate displayed image dimensions at the current zoom level.
    const displayedWidth = originalWidth * zoom;
    const displayedHeight = originalHeight * zoom;
    const halfContainerWidth = rect.width / 2;
    const halfContainerHeight = rect.height / 2;
    const halfImageWidth = displayedWidth / 2;
    const halfImageHeight = displayedHeight / 2;
    const maxPanX = Math.max(0, halfImageWidth - halfContainerWidth);
    const maxPanY = Math.max(0, halfImageHeight - halfContainerHeight);
  
    let newOffsetX = e.clientX - startPan.x;
    let newOffsetY = e.clientY - startPan.y;
  
    // Clamp offsets to keep image inside the viewport.
    newOffsetX = Math.max(-maxPanX, Math.min(newOffsetX, maxPanX));
    newOffsetY = Math.max(-maxPanY, Math.min(newOffsetY, maxPanY));
  
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
  
    const rect = containerRef.current.getBoundingClientRect();
    const displayedWidth = containerRef.current.clientWidth;
    const displayedHeight = containerRef.current.clientHeight;
  
    // Convert displayed coordinates to original image coordinates with zoom & pan
    const x = ((e.clientX - rect.left - offsetX) / (displayedWidth * zoom)) * originalWidth;
    const y = ((e.clientY - rect.top - offsetY) / (displayedHeight * zoom)) * originalHeight;
  
    setCursorPos({
      x: Math.max(0, Math.min(originalWidth, x)),
      y: Math.max(0, Math.min(originalHeight, y)),
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };
  
  const handleMouseMoveCombined = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseMove(e); // Handles cursor tracking
    handleMouseMovePan(e); // Handles panning
  };
  
  
  // Image click handler: assign manual pick and post it
  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left-click only
    if (!selectedGcp) {
      alert("Please select a GCP from the table first.");
      return;
    }
    if (!containerRef.current) return;
  
    if (isSubmitting.current) return;
    isSubmitting.current = true;
  
    // Check if this GCP is already marked
    const existingPick = manualPicks.some((pick) => pick.gcpId === selectedGcp._id);
    if (existingPick) {
      alert("This GCP is already assigned to the image.");
      isSubmitting.current = false;
      return;
    }
  
    const rect = containerRef.current.getBoundingClientRect();
    const displayedWidth = containerRef.current.clientWidth;
    const displayedHeight = containerRef.current.clientHeight;
  
    // Convert clicked position from displayed size to original image size with zoom & pan
    const x = ((e.clientX - rect.left - offsetX) / (displayedWidth * zoom)) * originalWidth;
    const y = ((e.clientY - rect.top - offsetY) / (displayedHeight * zoom)) * originalHeight;
  
    let fileName = "";
    try {
      const urlObj = new URL(imageUrl, window.location.origin);
      fileName = urlObj.searchParams.get("file") || "";
    } catch (error) {
      console.error("Error parsing imageUrl", error);
    }
  
    try {
      const res = await fetch(`/api/projects/${projectId}/gcps/picker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_id: fileId,
          file_name: fileName,
          gcp_id: selectedGcp._id,
          x: Math.round(x),
          y: Math.round(y),
        }),
      });
  
      if (res.ok) {
        const data = await res.json();
        const newPick: ManualPick = {
          _id: data.insertedId,
          gcpId: selectedGcp._id,
          x: Math.round(x),
          y: Math.round(y),
        };
  
        // **Ensure no duplicates**
        setManualPicks((prev) => {
          const pickSet = new Map(prev.map((p) => [p.gcpId, p]));
          pickSet.set(newPick.gcpId, newPick);
          return Array.from(pickSet.values());
        });
  
        setSelectedGcp(null);
      } else {
        console.error("Failed to post new pick");
        alert("Failed to post new pick. Please try again.");
      }
    } catch (error) {
      console.error("Error posting new pick:", error);
      alert("Error posting new pick. Please try again.");
    } finally {
      isSubmitting.current = false;
    }
  };
  
  // Remove pick: call DELETE API immediately
  const handleRemovePick = async (pickId: string, index: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/gcps/picker`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gcpImageId: pickId }),
      });
      if (res.ok) {
        setManualPicks((prev) => prev.filter((_, i) => i !== index));
      } else {
        console.error("Failed to delete pick");
        alert("Failed to delete pick. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting pick:", error);
      alert("Error deleting pick. Please try again.");
    }
  };
  
  const generateCroppedImages = useCallback(async () => {
    if (!imageUrl) return;
  
    const img = new window.Image();
    img.crossOrigin = "anonymous"; // Prevent CORS issues if applicable
    img.src = imageUrl;
  
    await new Promise((resolve) => {
      img.onload = resolve;
    });
  
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    if (!ctx) return;
  
    const newCroppedImages: { [key: string]: string } = {};
  
    manualPicks.forEach((pick) => {
      const size = 50; // 50x50 crop
      const halfSize = size / 2;
  
      // Calculate crop boundaries
      const cropX = Math.max(0, Math.min(originalWidth - size, pick.x - halfSize));
      const cropY = Math.max(0, Math.min(originalHeight - size, pick.y - halfSize));
  
      canvas.width = size;
      canvas.height = size;
  
      // Draw the cropped part of the image
      ctx.drawImage(img, cropX, cropY, size, size, 0, 0, size, size);
  
      // Draw a red dot in the center of the cropped image
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 4, 0, 2 * Math.PI); // Draw a circle at the center
      ctx.fill();
  
      newCroppedImages[pick.gcpId] = canvas.toDataURL();
    });
  
    setCroppedImages(newCroppedImages);
  }, [imageUrl, manualPicks, originalWidth, originalHeight]);
  

  // Run the cropping function when `manualPicks` updates
  useEffect(() => {
    if (manualPicks.length > 0) {
      generateCroppedImages();
    }
  }, [manualPicks, generateCroppedImages]);

  // --- Close button simply dismisses the popup ---
  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center w-screen h-screen bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg w-5/6 max-w-6xl h-fit relative flex flex-col">        {/* Show the extractedFileName in the heading */}
        <h3 className="text-xl font-bold mb-4">
          Image: {extractedFileName}
        </h3>
        <div className="flex space-x-4">
          {/* Left Section: Image with zoom, pan, and marker overlay */}
          <div className="w-2/5 flex items-center justify-center">
            <div
            ref={containerRef}
            className="relative border cursor-crosshair overflow-hidden select-none"
            onClick={handleImageClick}
            onMouseMove={handleMouseMoveCombined}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%", 
              height: "auto", 
              padding: 0,
              margin: 0,
              position: "relative",
          }}
          >
            <Image
              src={imageUrl}
              alt="Picker"
              width={originalWidth}
              height={originalHeight}
              className="block"
              style={{
                display: "block",
                transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
                transformOrigin: "center center",
              }}
            />

              {/* Cursor Position Display */}
              {cursorPos && (
                <div
                  className="fixed bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg"
                  style={{
                    left: `${Math.min(cursorPos.clientX + 5, window.innerWidth - 80)}px`, // Stay near the cursor, prevent clipping
                    top: `${Math.min(cursorPos.clientY + 5, window.innerHeight - 30)}px`, // Stay near the cursor, prevent clipping
                    zIndex: 9999, // Ensure it's always on top
                    pointerEvents: "none", // Avoid interfering with mouse events
                  }}
                >
                  {`x: ${cursorPos.x.toFixed(1)}, y: ${cursorPos.y.toFixed(1)}`}
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Global GCPs table (Expanded Width) */}
          <div className="w-3/5 space-y-4">
            <h4 className="text-lg font-semibold mb-2">Global GCPs</h4>

            {/* Table Container */}
            <div className="max-w-2xl overflow-auto border border-gray-300 rounded-lg">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-4 py-2 text-sm">Name</th>
                    <th className="border px-4 py-2 text-sm">Coordinates</th>
                    <th className="border px-4 py-2 text-sm">Marked</th>
                    <th className="border px-4 py-2 text-sm">Preview</th>
                    <th className="border px-4 py-2 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {globalGcps.map((gcp) => {
                    const markedPick = manualPicks.find((pick) => pick.gcpId === gcp._id);
                    return (
                      <tr key={gcp._id} className={selectedGcp?._id === gcp._id ? "bg-blue-100" : ""}>
                        <td className="border px-4 py-2 text-sm text-center">{gcp.name}</td>
                        <td className="border px-4 py-2 text-sm text-center break-words">
                        <span className="text-blue-600 font-semibold"> lat: </span>{gcp.lat}, 
                        <span className="text-red-600 font-semibold"> lon: </span>{gcp.lng}
                        </td>
                        <td className="border px-4 py-2 text-sm text-center break-words">
                          {markedPick ? (
                            <>
                              <span className="font-semibold">x: </span>{markedPick.x.toFixed(1)}, 
                              <span className="font-semibold">y: </span>{markedPick.y.toFixed(1)}
                            </>
                          ) : (
                            "Not marked"
                          )}
                        </td>
                        <td className="border px-4 py-2 text-sm text-center">
                          {markedPick && croppedImages[markedPick.gcpId] ? (
                            <Image
                              src={croppedImages[markedPick.gcpId]}
                              alt="Preview"
                              width={50} 
                              height={50} 
                              className="border rounded"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="border px-4 py-2 text-sm text-center">
                          {markedPick ? (
                            <button
                              onClick={() => handleRemovePick(markedPick._id!, manualPicks.indexOf(markedPick))}
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedGcp(gcp)}
                              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                            >
                              {selectedGcp?._id === gcp._id ? "Select" : "Select"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Close button is needed */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PickerPopup;
