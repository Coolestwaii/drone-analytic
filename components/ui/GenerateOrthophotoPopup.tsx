import React, { useState, useEffect } from "react";

const GenerateOrthophotoPopup = ({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("Initializing...");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Store elapsed time in seconds
  const [taskUuid, setTaskUuid] = useState<string | null>(null); // Store the UUID of the task
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let timerInterval: NodeJS.Timeout | null = null;

    const startSSE = () => {
      eventSource = new EventSource(`/api/projects/${projectId}/orthophoto`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress(data.progress || 0);
          setMessage(data.message || "Generating ortho...");

          if (data.progress === 100) {
            setIsCompleted(true);
            if (timerInterval) clearInterval(timerInterval); // Stop timer when completed
            eventSource?.close();
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
          setIsError(true);
          setMessage("Error during orthophoto generation");
          if (timerInterval) clearInterval(timerInterval); // Stop timer on error
          eventSource?.close();
        }
      };

      eventSource.onerror = () => {
        console.error("Error with SSE connection");
        setIsError(true);
        setMessage("Error during orthophoto generation");
        if (timerInterval) clearInterval(timerInterval); // Stop timer on error
        eventSource?.close();
      };
    };

    const startTask = async () => {
      try {
        setMessage("Creating task...");
        const response = await fetch(`/api/projects/${projectId}/orthophoto`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to create orthophoto generation task");
        }

        const data = await response.json();
        setTaskUuid(data.taskUuid); // Save the task UUID for cancellation
        setMessage("Generating ortho...");
        setElapsedTime(0); // Reset elapsed time

        // Start the timer
        timerInterval = setInterval(() => {
          setElapsedTime((prev) => prev + 1);
        }, 1000);

        // Start SSE connection after successful task creation
        startSSE();
      } catch (error) {
        console.error("Error creating task:", error);
        setIsError(true);
        setMessage("Error starting orthophoto generation");
        if (timerInterval) clearInterval(timerInterval);
      }
    };

    if (isOpen) {
      setProgress(0);
      setMessage("Initializing...");
      setIsCompleted(false);
      setIsError(false);

      // Start the task with POST, then follow with SSE
      startTask();
    }

    return () => {
      eventSource?.close();
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isOpen, projectId]);

  const handleClose = async () => {
    if (!isCompleted && taskUuid) {
      try {
        await fetch(`/api/projects/${projectId}/orthophoto`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uuid: taskUuid }),
        });
        console.log("Task canceled successfully.");
      } catch (error) {
        console.error("Error canceling task:", error);
      }
    }
    onClose();
  };

  return (
    isOpen && (
      <div className="flex items-center justify-center ">
        <div className="bg-white p-6 rounded shadow-lg w-fit">
          <h2 className="text-xl font-bold mb-4">Generate Orthophoto</h2>

          {/* Timer */}
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
              Generating...
            </div>
          )}

          <p className={`mb-4 ${isError ? "text-red-600" : "text-gray-700"}`}>{message}</p>
          <div className="relative w-full bg-gray-200 h-4 rounded">
            <div
              className={`absolute top-0 left-0 h-4 ${
                isError ? "bg-red-500" : "bg-green-500"
              } rounded`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {isCompleted && !isError && (
            <p className="mt-4 text-green-600 font-semibold">Generation complete!</p>
          )}
          {isError && (
            <p className="mt-4 text-red-600 font-semibold">An error occurred. Please try again.</p>
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

export default GenerateOrthophotoPopup;
