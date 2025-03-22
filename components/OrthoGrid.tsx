/* eslint-disable  @typescript-eslint/no-explicit-any */


import React, { useEffect, useState } from "react";
import Image from "next/image";
//import MetadataPopup from "./MetadataPopup"; // Import the popup component
import { mapCenterService } from "@/services/mapCenterService";
import { orthoOverlayService } from "@/services/orthoOverlayService";

interface OrthoThumbnailProps {
  projectId: string;
}

const OrthoGrid: React.FC<OrthoThumbnailProps> = ({ projectId }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [, setMetadata] = useState<Record<string, any> | null>(null);
  const [, setIsPopupOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/assets?action=metadata&file=odm_orthophoto/odm_orthophoto.tif`
      );
      if (response.ok) {
        const data = await response.json();

        // Extract important metadata
        const importantMetadata: Record<string, any> = {
          fileName: data.file,
          fileSize: data.metadata?.FileSize,
          dimensions: data.metadata?.ImageWidth
            ? `${data.metadata.ImageWidth} x ${data.metadata.ImageHeight}`
            : undefined,
          coordinateSystem: data.metadata?.GTCitation, // Example: WGS 84 / UTM zone
          megapixels: data.metadata?.Megapixels,
        };

        setMetadata(importantMetadata);
      } else {
        console.error("Failed to fetch orthophoto metadata");
      }
    } catch (error) {
      console.error("Error fetching orthophoto metadata:", error);
    }
  };

  const fetchBoundsAndUpdateMap = async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/assets?action=serve&file=bounds.json`
      );
      if (response.ok) {
        const bounds = await response.json();
        const center = bounds.center;

        // Update map center using mapCenterService
        mapCenterService.setCenter([center.lat, center.lon]);

        // Store top-left and bottom-right bounds (if needed later)
        console.log("Center set to:", center);
        console.log("Top-left:", bounds.top_left);
        console.log("Bottom-right:", bounds.bottom_right);

        // Update the orthophoto overlay
        const imageUrl = `/api/projects/${projectId}/assets?action=serve&file=odm_orthophoto/odm_orthophoto.png`;
        orthoOverlayService.setOverlay(imageUrl, [
          [bounds.top_left.lat, bounds.top_left.lon],
          [bounds.bottom_right.lat, bounds.bottom_right.lon],
        ]);
      } else {
        console.error("Failed to fetch bounds.json");
      }
    } catch (error) {
      console.error("Error fetching bounds.json:", error);
    }
  };

  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        // Build the URL for fetching the orthophoto thumbnail
        const url = `/api/projects/${projectId}/assets?action=serve&file=odm_orthophoto/odm_orthophoto.png&size=medium`;

        // Test if the thumbnail exists by fetching it
        const response = await fetch(url);

        if (response.ok) {
          setThumbnailUrl(url); // If successful, set the thumbnail URL
          await fetchMetadata(); // Fetch metadata only if thumbnail exists
        } else {
          setError("Orthophoto not found or not created yet.");
        }
      } catch (err) {
        console.error("Error fetching orthophoto thumbnail:", err);
        setError("An error occurred while fetching the orthophoto.");
      }
    };

    fetchThumbnail();
  }, [projectId]);

  const handleThumbnailClick = async () => {
    await fetchBoundsAndUpdateMap(); // Call the function to fetch bounds and update the map
    setIsPopupOpen(true); // Open the metadata popup
  };

  // Function to handle download
  const handleDownload = async () => {
    try {
      const imageUrl = `/api/projects/${projectId}/assets?action=serve&file=odm_orthophoto/odm_orthophoto.tif`;
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Failed to download the orthophoto.");
      }

      // Convert response to blob
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "orthophoto.tif"; // File name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading orthophoto:", error);
      alert("Failed to download the orthophoto. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="mt-6">
        <p className="text-gray-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {thumbnailUrl ? (
        <div onClick={handleThumbnailClick} className="cursor-pointer">
          <Image
            src={thumbnailUrl || ""}
            alt="Orthophoto Thumbnail"
            width={500}
            height={500}
            className="p-2"
          />
          <button
            onClick={handleDownload}
            className="mt-4 bg-[#d7efb6] text-black font-medium w-full py-2 rounded-lg shadow-md hover:bg-[#b3da7d] transition-all"
          >
            Download Orthophoto
          </button>
        </div>
      ) : (
        <p className="text-gray-500 text-center">Loading thumbnail...</p>
      )}
      {/*
      <MetadataPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        imageUrl={thumbnailUrl}
        metadata={metadata}
      />*/}
    </div>
  );
};

export default OrthoGrid;
