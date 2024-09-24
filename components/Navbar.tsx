'use client'
import React from "react";
import Link from "next/link";
import MobileNav from "./MobileNav";
import { PiDroneDuotone } from "react-icons/pi";
import { navbarLinks } from "@/constant";


const Navbar = () => {
  return (
    <nav className="z-10 fixed w-full gap-5 p-6 dark:shadow-none ">
      <div className="bg-white/40 backdrop-blur flex items-center justify-between rounded-2xl px-8 py-2 border-[2px] border-emerald-500/50">
        <Link href="/" className="flex items-center gap-2">
        <PiDroneDuotone  className="text-5xl"
        />
        <p className="text-2xl font-bold text-black max-md:hidden">
          Drone<span className="text-emerald-500"> Analytic</span>
        </p>
      </Link>
      <div className="flex justify-end gap-7 ">
      {navbarLinks.map((navlink,i) => {
  return (
    <Link key={i}
    href={navlink.url} className="flex items-center gap-2">
 <p className="text-black max-sm:hidden">
 {navlink.title}
 </p>
</Link>)
})}
      
        <MobileNav />
      </div>
      </div>
      
    </nav>
  );
};

export default Navbar;
