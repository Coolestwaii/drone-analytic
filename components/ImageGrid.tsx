/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { mapCenterService } from "@/services/mapCenterService";
import MetadataPopup from "./ui/MetadataPopup";
import { FiTrash } from 'react-icons/fi';

interface ImageGridProps {
  projectId: string;
  setCenter: (lat: number, lng: number) => void;
  refresh?: number;
}

const ImageGrid: React.FC<ImageGridProps> = ({ projectId, setCenter,refresh }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const convertToDecimalDegrees = (dms: string, ref: string): number => {
    const parts = dms.split(/[^\d.]+/).filter(Boolean);
    const degrees = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;

    let decimalDegrees = degrees + minutes / 60 + seconds / 3600;
    if (ref === "S" || ref === "W") {
      decimalDegrees *= -1;
    }
    return decimalDegrees;
  };

  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/assets?action=list`);
      if (response.ok) {
        const data = await response.json();
  
        // Filter only files with file_type as "image"
        const imageFiles = data.files
          .filter((file: { file_type: string }) => file.file_type === "image")
          .map((file: { file_name: string }) =>
            `/api/projects/${projectId}/assets?action=serve&file=${encodeURIComponent(
              file.file_name
            )}&size=small`
          );
  
        setImages(imageFiles);
      } else {
        console.error("Failed to fetch images");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }, [projectId]);
  

  useEffect(() => {
    fetchImages();
  }, [fetchImages,refresh]);

  const handleImageClick = async (image: string) => {
    const fileName = decodeURIComponent(image.split("file=")[1].split("&")[0]);
    setSelectedImage(image.replace("&size=small", "&size=normal"));
    setIsPopupOpen(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/assets?action=metadata&file=${encodeURIComponent(fileName)}`
      );

      if (response.ok) {
        const data = await response.json();

        // Extract and send only important metadata
        const importantMetadata: Record<string, any> = {
          fileName: data.file,
          fileSize: data.metadata?.FileSize,
          dimensions: data.metadata?.ExifImageWidth
            ? `${data.metadata.ExifImageWidth} x ${data.metadata.ExifImageHeight}`
            : "Unknown",
          latitude:
            data.metadata?.GPSLatitude && data.metadata?.GPSLatitudeRef
              ? convertToDecimalDegrees(data.metadata.GPSLatitude, data.metadata.GPSLatitudeRef)
              : null,
          longitude:
            data.metadata?.GPSLongitude && data.metadata?.GPSLongitudeRef
              ? convertToDecimalDegrees(data.metadata.GPSLongitude, data.metadata.GPSLongitudeRef)
              : null,
        };

        setMetadata(importantMetadata);

        // Update the map center if GPS coordinates are available
        if (importantMetadata.latitude && importantMetadata.longitude) {
          setCenter(importantMetadata.latitude, importantMetadata.longitude);
          mapCenterService.setCenter([importantMetadata.latitude, importantMetadata.longitude]);
        }
      } else {
        console.error("Failed to fetch metadata");
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  const handleDeleteImage = async (fileName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${fileName}?`);
    if (!confirmDelete) return;
  
    try {
      const response = await fetch(`/api/projects/${projectId}/image?file=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        alert("Image deleted successfully");
        fetchImages(); // Refresh images after deletion
      } else {
        const errorData = await response.json();
        alert(`Failed to delete image: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Error deleting image");
    }
  };
  

  return (
    <>
      <div className="w-max h-auto overflow-y-auto ml-2">
        <div className="grid grid-cols-3 gap-y-4 gap-x-2">
        {images.map((image, index) => {
          const fileName = decodeURIComponent(image.split("file=")[1].split("&")[0]);
          return (
            <div key={index} className="relative group">
              <Image
                src={image}
                alt={`Project Image ${index + 1}`}
                width={600}
                height={600}
                className="w-max h-auto cursor-pointer rounded-sm"
                onClick={() => handleImageClick(image)}
              />
              <button
                onClick={() => handleDeleteImage(fileName)}
                className="absolute top-1 right-1 bg-black bg-opacity-60 p-1 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <FiTrash className="text-sm"/>
              </button>
            </div>
          );
        })}
        </div>
      </div>
      <MetadataPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        imageUrl={selectedImage}
        metadata={metadata}
      />
    </>
  );
};

export default ImageGrid;
