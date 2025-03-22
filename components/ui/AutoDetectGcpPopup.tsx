"use client";

import React, { useState, useEffect } from "react";

interface AutoDetectGcpPopupProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const AutoDetectGcpPopup: React.FC<AutoDetectGcpPopupProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("Initializing GCP detection...");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [uploadedImages, setUploadedImages] = useState<{ file_name: string; image_uuid: string }[]>([]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isOpen) return;

    let timerInterval: NodeJS.Timeout | null = null;

    const startTask = async () => {
      try {
        setMessage("Uploading images for GCP detection...");

        // Start the timer
        setElapsedTime(0);
        timerInterval = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);

        // Call the API to start image upload to Flask
        const response = await fetch(`/api/projects/${projectId}/gcps/detect`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to start GCP detection task");
        }

        const data = await response.json();
        setUploadedImages(data.uploaded_images || []);

        setProgress(100);
        setMessage("GCP detection process completed!");
        setIsCompleted(true);

        if (timerInterval) clearInterval(timerInterval);
      } catch (error) {
        console.error("Error during GCP detection:", error);
        setIsError(true);
        setMessage("Error during GCP detection process.");
        if (timerInterval) clearInterval(timerInterval);
      }
    };

    startTask();

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isOpen, projectId]);

  const handleClose = () => {
    onClose();
  };

  return (
    isOpen && (
      <div className="flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-fit">
          <h2 className="text-xl font-bold mb-4">GCP Detection Process</h2>

          {/* Timer Display */}
          <p className="mb-4 text-gray-700">
            Elapsed Time: <strong>{formatTime(elapsedTime)}</strong>
          </p>

          {/* Loading Animation */}
          {!isCompleted && !isError && (
            <div className="mb-4 text-gray-700 flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 text-gray-700 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              Processing...
            </div>
          )}

          <p className={`mb-4 ${isError ? "text-red-600" : "text-gray-700"}`}>
            {message}
          </p>

          {/* Progress Bar */}
          <div className="relative w-full bg-gray-200 h-4 rounded">
            <div
              className={`absolute top-0 left-0 h-4 ${isError ? "bg-red-500" : "bg-green-500"} rounded`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {isCompleted && !isError && (
            <p className="mt-4 text-green-600 font-semibold">
              GCP detection completed successfully!
            </p>
          )}
          {isError && (
            <p className="mt-4 text-red-600 font-semibold">
              An error occurred. Please try again.
            </p>
          )}

          {/* Uploaded Images List */}
          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Uploaded Images:</h3>
              <ul className="text-sm text-gray-600 mt-2">
                {uploadedImages.map((img) => (
                  <li key={img.image_uuid}>
                    {img.file_name} → <span className="text-blue-500">{img.image_uuid}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="mt-4 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded"
          >
            {isCompleted || isError ? "Close" : "Cancel Task & Close"}
          </button>
        </div>
      </div>
    )
  );
};

export default AutoDetectGcpPopup;
