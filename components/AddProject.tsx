'use client';

import React, { useState } from 'react';
import { AiOutlineUpload } from 'react-icons/ai';
import Image from 'next/image'; // Import Image component

const AddProject = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null); // State for CSV file
  const [csvContent, setCsvContent] = useState<string>(''); // State for displaying CSV content
  const [imageFiles, setImageFiles] = useState<File[]>([]); // State for image files
  const [step, setStep] = useState(1); // State to track the step (1: CSV Upload, 2: Image Upload, 3: Project Info)

  // Handle CSV file selection
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setCsvFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCsvContent(event.target.result as string); // Save CSV content
        }
      };
      reader.readAsText(selectedFile);
    } else {
      alert('Please upload a CSV file only.');
    }
  };

  // Handle Image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const validImages = Array.from(selectedFiles).filter((file) =>
        ['image/jpeg', 'image/png', 'image/tiff'].includes(file.type)
      );
      setImageFiles(validImages);
    }
  };

  // Move to the next step (from CSV to Image upload or from Image to Project Info)
  const handleNextStep = () => {
    if (step === 1 && csvFile) {
      setStep(2); // Move to step 2 after uploading CSV
    } else if (step === 2 && imageFiles.length > 0) {
      setStep(3); // Move to step 3 after uploading images
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-center mb-6">
        {step === 1
          ? 'Upload Ground Control Point File'
          : step === 2
          ? 'Upload Drone Image'
          : 'Project Information'}
      </h1>

      {/* Step 1: CSV File Upload */}
      {step === 1 && (
        <div className="flex justify-between mb-6">
          <div className="flex flex-col justify-center items-center bg-gray-100 p-6 w-full max-w-[300px] border-dashed border-2 rounded-lg">
            <AiOutlineUpload className="text-4xl text-gray-400 mb-4" />
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-lg file:bg-green-100"
            />
            <span className="text-sm text-gray-500 mt-2">Upload GCP File</span>
          </div>

          {/* CSV File Preview Section */}
          <div className="ml-6 flex-1">
            <h2 className="text-xl font-semibold mb-2">File Preview</h2>
            <div className="bg-gray-100 p-4 rounded-lg max-h-[300px] overflow-auto">
              {csvContent ? (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{csvContent}</pre>
              ) : (
                <p className="text-center text-gray-500">No file selected</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Image File Upload */}
      {step === 2 && (
        <div className="flex justify-between mb-6">
          <div className="flex flex-col justify-center items-center bg-gray-100 p-6 w-full max-w-[300px] border-dashed border-2 rounded-lg">
            <AiOutlineUpload className="text-4xl text-gray-400 mb-4" />
            <input
              type="file"
              accept=".jpg,.png,.tif,.tiff"
              multiple
              onChange={handleImageChange}
              className="file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-lg file:bg-green-100"
            />
            <span className="text-sm text-gray-500 mt-2">Upload Image File</span>
          </div>

          {/* Image Preview Section */}
          <div className="ml-6 flex-1">
            <h2 className="text-xl font-semibold mb-2">Image Preview</h2>
            <div className="bg-gray-100 p-4 rounded-lg max-h-[300px] overflow-auto">
              {imageFiles.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <Image
                        src={URL.createObjectURL(file)} // Use Image from Next.js
                        alt={`Preview ${file.name}`}
                        width={80}
                        height={80}
                        className="object-cover rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-2">{file.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No images selected</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Project Information */}
      {step === 3 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Project Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Project Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Tag Name</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter tag name"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Project Description</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter project description"
              />
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleNextStep}
          className="bg-green-500 text-white py-2 px-8 rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AddProject;
