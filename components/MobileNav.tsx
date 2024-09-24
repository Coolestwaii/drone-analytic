"use client";

import React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { IoMenu } from "react-icons/io5";
import Link from "next/link";
import { sidebarLinks } from "@/constant";
import { usePathname } from "next/navigation";
import { PiDroneDuotone } from "react-icons/pi";

const MobileNav = () => {
  const pathname = usePathname();
  return (
    <Sheet >
      <SheetTrigger asChild className="sm:hidden">
        <IoMenu className="text-black text-4xl" />   
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-gray-200 border-none"
      >
        <Link href="/" className="flex items-center gap-3">
        <PiDroneDuotone className="text-5xl"
        />
        <p className="text-xl font-bold text-black">
          Drone <br/><span className="text-emerald-500">Analytic</span>
        </p>
      </Link>
        <div>
          <SheetClose asChild>
          <section className="flex h-full flex-col gap-6 pt-16">
      {sidebarLinks.map((item) => {
        const isActive =
          (pathname.includes(item.url) && item.url.length > 1) ||
          pathname === item.url;

        return (
          <SheetClose asChild key={item.url}>
            <Link
              href={item.url}
              className={`${
                isActive
                  ? "primary-gradient rounded-lg text-light-900"
                  : "text-dark300_light900"
              } flex items-center justify-start gap-4 bg-transparent p-4`}
            >
              {item.icon}
              <p className={`${isActive ? "base-bold" : "base-medium"}`}>
                {item.title}
              </p>
            </Link>
          </SheetClose>
        );
      })}
    </section>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
