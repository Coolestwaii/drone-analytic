'use client';

import { FiLogOut } from "react-icons/fi";
import React, { ReactNode, useState } from 'react';
import { projects } from '@/services';
import { BsPersonCircle, BsFolder } from 'react-icons/bs';
import { AiOutlineProduct } from 'react-icons/ai';
import Link from 'next/link';
import { Project } from '@/types/project';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { IoClose } from "react-icons/io5";

interface LeftSidebarProps {
  child?: ReactNode;
}

const LeftSidebar = ({ child }: LeftSidebarProps) => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // Track active menu

  const { data: session } = useSession();

  const handleButtonProject = () => {
    setIsActive((prev) => !prev);
  };

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu); // Set active menu
    setIsActive(true);
  };

  return (
    <div className="ml-3 fixed left-0 z-50 top-6 flex h-fit w-fit gap-1 items-start">
      <div className="bg-white rounded-lg flex h-fit w-fit flex-col justify-between p-3 shadow-light-300 dark:shadow-none max-w-[266px] shadow-xl shadow-black/70">
        {/* User info section */}
        <div className="flex items-center justify-between w-full p-3 border-b-[1px] border-[#B3B3B3]">
          {session ? (
            <>
              <Image
                src={session.user?.image || '/default-avatar.png'}
                alt={`${session.user?.name}'s profile`}
                width={40}
                height={40}
                className="rounded-full ml-[-10px]"
              />
              <div className="flex flex-col flex-grow ml-2">
                <p className="font-semibold text-sm">{session.user?.name || 'Unknown User'}</p>
                <p className="text-xs text-gray-400 font-semibold">{session.user?.email || 'No Email'}</p>
              </div>
            </>
          ) : (
            <>
              <BsPersonCircle className="text-4xl text-[#C0E888]" />
              <div className="flex flex-col">
                <p className="font-semibold text-sm">@Guest</p>
                <p className="text-xs text-gray-500 font-semibold">Sign In to start</p>
              </div>
            </>
          )}
        </div>

        {/* Project section */}
        <div className="flex gap-4 items-center w-full p-3 border-b-[1px] border-[#B3B3B3]">
          <div className="flex flex-1 flex-col">
            <Link
              href="/project/list"
              onClick={() => handleMenuClick('addProject')}
              className={`flex items-start justify-start gap-2 p-2  transition-all 
              ${activeMenu === 'addProject' ? 'bg-[#C0E888] hover:translate-x-[5px] rounded-md' : 'hover:border-l-4 hover:border-[#C0E888] hover:translate-x-[5px]'}`}
            >
              <BsFolder className="text-xl" />
              <p>Add Project</p>
            </Link>
          </div>
        </div>

        {/* Map through the projects */}
        <div className="flex flex-1 flex-col mt-5 mr-1">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              onClick={() => handleMenuClick(project.id)}
              className={`flex items-start justify-start gap-2 p-2 mb-1  transition-all 
              ${activeMenu === project.id ? 'bg-[#C0E888] rounded-md hover:translate-x-[5px]' : 'hover:border-l-4 hover:border-[#C0E888] hover:translate-x-[5px]'}`}
            >
              <AiOutlineProduct className="text-xl" />
              <p>{project.name}</p>
            </Link>
          ))}
        </div>
        
        <div className="mt-3 flex flex-col items-center justify-center font-semibold">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="py-2 px-3 w-full text-white bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <FiLogOut className="text-ml font-bold stroke-[3]" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Conditional rendering for child component */}
      {isActive && (
        <div className="bg-white rounded-lg flex h-auto w-fit flex-col justify-between p-3 shadow-light-300 dark:shadow-none max-h-[650px] max-w-[500px] overflow-y-auto shadow-xl shadow-black/70">
          {child}
        </div>
      )}

      {/* Close button */}
      {isActive && (
        <button onClick={handleButtonProject} className="text-2xl absolute top-0 right-0 mt-4 mr-6">
          <IoClose />
        </button>
      )}
    </div>
  );
};

export default LeftSidebar;
