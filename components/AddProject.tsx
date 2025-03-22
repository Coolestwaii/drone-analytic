'use client';

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";

const AddProject = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [step, setStep] = useState(1);
  const { data: session } = useSession();
  const router = useRouter();

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!projectName) {
      alert('Please enter a project name.');
      return;
    }

    try {
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          user_id: session?.user?.user_id || "d08ca8fd-737b-4d29-9c52-066966b156bb", 
          center: { lat: 16.770333333333333, lng: 100.19731944444445 },
        }),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      alert('Project created successfully.');
      const projectData = await projectResponse.json();
      router.push(`/project/${projectData.id}`);
    } catch (error) {
      console.error('Error during submission:', error);
      alert('Failed to submit the project. Please try again.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 ">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="p-8 max-w-lg w-full mx-auto bg-white backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl relative flex flex-col text-black"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-3xl"
        >
          &times;
        </button>

        {/* Step Title */}
        <h1 className="text-2xl font-bold text-center mb-4 mt-4">
          {step === 1 ? '🌠 Create a New Project' : 'Confirm Project ✨'}
        </h1>

        {/* Step 1 - Input Fields */}
        {step === 1 && (
          <div className="space-y-6 p-4">
            <div>
              <label className="block text-sm font-semibold">Project Name</label>
              <input
                type="text"
                className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-100 text-gray-900"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Project Description</label>
              <textarea
                className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-100 text-gray-900"
                placeholder="Enter project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2 - Confirmation */}
        {step === 2 && (
          <div className="p-6 space-y-4 text-black">
            <p className="text-start text-lg">Confirm project details:</p>
            <p><strong>Project Name:</strong> {projectName}</p>
            <p><strong>Project Description:</strong> {projectDescription || 'No description'}</p>
          </div>
        )}

        {/* Footer: Next or Submit Button */}
        <div className="flex justify-center mt-6">
          {step === 2 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="bg-black  text-white py-3 px-8 rounded-xl shadow-lg  transition-all"
            >
              Submit
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextStep}
              className="bg-black text-white py-3 px-8 rounded-xl shadow-lg  transition-all"
            >
              Next
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AddProject;
