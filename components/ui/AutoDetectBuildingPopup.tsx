'use client';

import React, { useState, useEffect } from "react";

interface AutoDetectBuildingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const AutoDetectBuildingPopup: React.FC<AutoDetectBuildingPopupProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("Initializing auto-detect...");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // seconds elapsed
  const [taskUuid, ] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isOpen) return;

    let eventSource: EventSource | null = null;
    let timerInterval: NodeJS.Timeout | null = null;

    const startSSE = () => {
      // Updated URL to /building
      eventSource = new EventSource(`/api/projects/${projectId}/building`);

      eventSource.onmessage = (event) => {
        if (event.data.trim().startsWith(":")) {
          return;
        }
        try {
          const data = JSON.parse(event.data);
          setProgress(data.progress || 0);
          setMessage(data.message || "Processing building footprint...");

          if (data.progress === 100) {
            setIsCompleted(true);
            if (timerInterval) clearInterval(timerInterval);
            eventSource?.close();
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
          setIsError(true);
          setMessage("Error during building footprint process");
          if (timerInterval) clearInterval(timerInterval);
          eventSource?.close();
        }
      };

      eventSource.onerror = () => {
        console.error("Error with SSE connection");
        setIsError(true);
        setMessage("Error during building footprint process");
        if (timerInterval) clearInterval(timerInterval);
        eventSource?.close();
      };
    };

    const startTask = async () => {
      try {
        setMessage("Creating building footprint task...");
        // Use POST to start the building task instead of GET.
        const response = await fetch(`/api/projects/${projectId}/building`, {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error("Failed to start building task");
        }

        setMessage("Building footprint task in progress...");
        setElapsedTime(0);

        timerInterval = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);

        startSSE();
      } catch (error) {
        console.error("Error starting building task:", error);
        setIsError(true);
        setMessage("Error starting building task");
        if (timerInterval) clearInterval(timerInterval);
      }
    };

    startTask();

    return () => {
      eventSource?.close();
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isOpen, projectId]);

  const handleClose = async () => {
    // Optionally send a cancellation request here if needed.
    if (!isCompleted && taskUuid) {
      try {
        await fetch(`/api/projects/${projectId}/building`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid: taskUuid }),
        });
        console.log("Building task canceled.");
      } catch (error) {
        console.error("Error canceling building task:", error);
      }
    }
    onClose();
  };

  return (
    isOpen && (
      <div className="flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-fit">
          <h2 className="text-xl font-bold mb-4">Building Footprint Process</h2>

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

          <div className="relative w-full bg-gray-200 h-4 rounded">
            <div
              className={`absolute top-0 left-0 h-4 ${isError ? "bg-red-500" : "bg-green-500"} rounded`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {isCompleted && !isError && (
            <p className="mt-4 text-green-600 font-semibold">
              Building footprint process complete!
            </p>
          )}
          {isError && (
            <p className="mt-4 text-red-600 font-semibold">
              An error occurred. Please try again.
            </p>
          )}

          {/* Always Show Close Button */}
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

export default AutoDetectBuildingPopup;
