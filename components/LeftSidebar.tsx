'use client';

import React, { ReactNode, useState } from 'react';
import { projects } from '@/constant';
import { BsPersonCircle } from 'react-icons/bs';
import { AiOutlineProduct } from 'react-icons/ai';
import Link from 'next/link';

interface LeftSidebarProps {
  child?: ReactNode;
}

const LeftSidebar = ({ child }: LeftSidebarProps) => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const handleButtonProject = () => {
    setIsActive((prev) => !prev);
  };
  return (
    <div className="ml-3 fixed left-0 z-50 top-16 flex h-fit w-fit gap-1 items-start">
      <div className="bg-white rounded-lg  flex h-fit w-fit flex-col justify-between p-3 shadow-light-300 dark:shadow-none max-w-[266px] shadow-xl shadow-black/70">
        <div className="flex gap-4 items-center w-full p-3 border-b-[1px] border-black/50">
          <BsPersonCircle className="text-4xl" />
          <div className="flex flex-col">
            <p className="font-semibold text-sm text-black">@mike09</p>
            <p className="text-xs">michaeljohnson000@gmail.com</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col mt-5">
          {projects.map((project, i) => {
            return (
              <Link
                key={i}
                href={`/project/${project.id}`}
                onClick={() => {
                  setIsActive(true);
                }}
                className="flex items-start justify-start gap-2 bg-transparent p-2 hover:bg-black/10 rounded-md"
              >
                <AiOutlineProduct className="text-xl" />
                <p>{project.name}</p>
              </Link>
            );
          })}
        </div>
      </div>
      {isActive ? (
        <div className="bg-white rounded-lg flex h-fit w-fit flex-col justify-between p-3 shadow-light-300 dark:shadow-none max-h-[650px] max-w-[500px] overflow-y-auto shadow-xl shadow-black/70">
          {child}
        </div>
      ) : null}
      {isActive ? (
        <button
          onClick={handleButtonProject}
          className="text-white bg-red-600 px-2 py-1 rounded-md shadow-xl shadow-black/70"
        >
          Close
        </button>
      ) : null}
    </div>
  );
};

export default LeftSidebar;
