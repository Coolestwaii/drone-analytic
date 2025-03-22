/* eslint-disable  @typescript-eslint/no-explicit-any */
'use client';
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaRegImages } from "react-icons/fa"; // Changed icon

interface MetadataPopupProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
}

const MetadataPopup: React.FC<MetadataPopupProps> = ({ isOpen, onClose, imageUrl, metadata }) => {
  if (!isOpen || !metadata) return null;

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed top-4 right-4 bg-white shadow-md border border-gray-300 rounded-lg p-4 w-72 max-h-[70vh] overflow-y-auto z-50"
    >
      {/* Header Section */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <FaRegImages className="text-lg text-black mt-0.5" />
          <h2 className="text-sm font-semibold text-gray-700">Image Details</h2>
        </div>
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-600 text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Image Display (Reduced Size) */}
      {imageUrl && (
        <div className="overflow-hidden rounded-lg border border-gray-300 mt-2">
          <Image src={imageUrl} alt="Preview" width={250} height={250} className="w-full h-auto" />
        </div>
      )}

      {/* Metadata */}
      <div className="mt-2 space-y-1 text-sm">
        {Object.entries(metadata).map(([key, value]) => {
          if (key === "GPSLatitude" && metadata.GPSLongitude) {
            return (
              <div key="gps-coordinates" className="bg-gray-100 p-1 rounded-lg">
                <h4 className="font-medium">🌍 GPS</h4>
                <p>
                  <strong>Lat:</strong> {convertToDecimalDegrees(metadata.GPSLatitude, metadata.GPSLatitudeRef || "")}
                  <br />
                  <strong>Lng:</strong> {convertToDecimalDegrees(metadata.GPSLongitude, metadata.GPSLongitudeRef || "")}
                </p>
              </div>
            );
          }

          if (key === "GPSLongitudeRef") return null;

          return (
            <div key={key} className="flex justify-between bg-gray-100 p-1 rounded-lg">
              <span className="text-gray-600">{key}:</span>
              <span className="text-gray-800">{String(value)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MetadataPopup;
