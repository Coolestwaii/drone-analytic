"use client";

import React, { useState } from "react";

const Shared = ({ projectId }: { projectId: string }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleShareProject = async () => {
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter an email.");
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to share project");
      }

      setMessage(`Project shared with ${email}`);
      setEmail(""); // Reset input
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4">Share Project</h2>

      {/* Email Input */}
      <div className="mb-4">
        <input
          type="email"
          className="w-full p-3 border rounded-md"
          placeholder="Enter user email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Display Messages */}
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {message && <p className="text-green-500 mb-2">{message}</p>}

      {/* Share Button */}
      <button
        className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-700"
        onClick={handleShareProject}
      >
        Share Project
      </button>
    </div>
  );
};

export default Shared;
