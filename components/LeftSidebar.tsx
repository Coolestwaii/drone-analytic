"use client";

import Link from "next/link";
import React from "react";
import { sidebarLinks } from "@/constant";
import { usePathname } from "next/navigation";
import { BsPersonCircle } from "react-icons/bs";


const LeftSidebar = () => {
  const pathname = usePathname();
  return (
    <section className="custom-scrollbar ml-6 bg-white/40 backdrop-blur rounded-xl fixed left-0 top-32 flex h-fit w-fit flex-col justify-between overflow-y-auto border-r p-3 shadow-light-300 dark:shadow-none max-sm:hidden lg:w-[266px]">
      <div className="flex gap-4 items-center w-full p-3 border-b-[1px] border-black/50">
        <BsPersonCircle className="text-4xl"/>
        <div className="flex flex-col">
          <p className="font-semibold text-sm text-black">@mike09</p>
          <p className="text-xs">michaeljohnson000@gmail.com</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {sidebarLinks.map((item) => {
          const isActive =
            (pathname.includes(item.url) && item.url.length > 1) ||
            pathname === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`${
                isActive
                  ? "primary-gradient rounded-lg text-light-900"
                  : "text-dark300_light900"
              } flex items-center justify-start gap-2 bg-transparent p-2 m-2 hover:bg-slate-200`}
            >
              
              {item.icon}
              <p>
                {item.title}
              </p>
            </Link>
          );
        })}
      </div>
      
    </section>
  );
};

export default LeftSidebar;
