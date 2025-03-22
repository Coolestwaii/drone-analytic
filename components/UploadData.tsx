'use client';

import React, { useState } from 'react';
import { AiOutlineUpload } from 'react-icons/ai';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from "framer-motion";

const UploadData = ({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  if (!projectId) {
    console.error("projectId is undefined. Ensure it is passed from the parent component.");
    return null; // Prevent rendering if projectId is missing
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const validImages = Array.from(selectedFiles).filter((file) =>
        ['image/jpeg', 'image/png', 'image/tiff'].includes(file.type)
      );
      setImageFiles(validImages);
    }
  };

  const handleSubmit = async () => {
    if (imageFiles.length === 0) {
      alert('Please upload at least one image.');
      return;
    }

    try {
      // Create a FormData object
      const formData = new FormData();

      // Append images
      imageFiles.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        body: formData, // Send FormData as the request body
      });

      if (!response.ok) {
        throw new Error('Failed to upload files');
      }

      alert('Files uploaded successfully.');
      onClose(); // Close the modal
      router.push(`/project/${projectId}`); // Redirect to the project page
    } catch (error) {
      console.error('Error during submission:', error);
      alert('Failed to upload files. Please try again.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="p-8 max-w-7xl w-2/4 h-3/4 mx-auto bg-white  rounded-2xl shadow-2xl border border-[#C0E888] relative flex flex-col"
      > 
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <h1 className="text-2xl font-bold text-center mb-4 mt-4">
          Upload Drone Image
        </h1>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col justify-center items-center h-fit bg-gray-100 p-8 border-dashed border-2 border-[#73C400] rounded-lg">
              <AiOutlineUpload className="text-7xl text-[#73C400] mb-6" />
              <input
                type="file"
                accept=".jpg,.png,.tif,.tiff"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="bg-[#C0E888] text-black py-3 px-6 rounded-lg cursor-pointer shadow-md hover:bg-[#73C400] transition-colors"
              >
                Upload Images
              </label>
              <span className="text-sm text-gray-500 mt-3">
                *Upload jpg, png, tif, tiff files only
              </span>
            </div>

            <div className="flex flex-col p-2">
              <div className="bg-gray-50 px-4 py-0 rounded-lg h-fit overflow-auto shadow-inner border border-gray-300">
                {imageFiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 p-4 mt-2">
                    {imageFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center cursor-pointer"
                        onClick={() => setSelectedImage(URL.createObjectURL(file))}
                      >
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${file.name}`}
                          width={200}
                          height={200}
                          className="object-cover rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-2">{file.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 p-6">No images selected</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Submit Button */}
        <div className="flex justify-end mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="bg-black text-white py-3 px-8 w-fit rounded-xl shadow-lg transition-all"
          >
            Submit
          </motion.button>
        </div>


        {/* Popup Modal for Full-Size Image */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative bg-white p-4 rounded-lg max-w-3xl">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
              <Image
                src={selectedImage}
                alt="Full-size preview"
                width={800}
                height={800}
                className="object-contain"
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadData;
