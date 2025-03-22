'use client';
import React, { useState } from 'react';
import Image from 'next/image';
const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState('Welcome'); // Initial state

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu); // Update active menu
  };

  // Define content (Image or icon) based on active menu
  const getContent = (menu: string) => {
    switch (menu) {
      case 'Welcome':
        return (
          <>
            <div className='flex flex-row'>
            <Image
              src="/Map.png" // Map image for 'Welcome' menu
              alt="drone"
              width={23}
              height={24}
              className="object-contain"
            />
            <span className="ml-2">Welcome</span> {/* Add the text next to the image */}
            </div>
          </>
        );
    }
  };

  return (
    <nav
      className="z-50 fixed w-full mt-4 px-4 bg-white rounded-[64px] shadow-md border-2 border-transparent bg-clip-padding"
      style={{
        backgroundImage: 'linear-gradient(#ffffff, #ffffff), linear-gradient(to right, #C0E888, #AEEFEF)',
        backgroundOrigin: 'padding-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <div className="flex justify-between items-center">
        {/* Left Navigation Links */}
        <div className="flex gap-10">
          <button
            onClick={() => handleMenuClick('Welcome')}
            className="text-white font-bold text-ms focus:outline-none"
          >
            Welcome
          </button>
          <button
            onClick={() => handleMenuClick('Our Product')}
            className="text-white font-bold text-ms focus:outline-none opacity-100"
          >
            
          </button>
          {/* Left Navigation Links 
          <button
            onClick={() => handleMenuClick('How To Use')}
            className="text-[#1E1E1E] font-bold text-lg focus:outline-none"
          >
            How To Use
          </button>*/}
        </div>

        {/* Center Section with dynamic image or icon and text */}
        <div className="flex items-center gap-2 select-none rounded-md px-4 py-2 shadow-sm opacity-100">
          <div className="text-ms font-bold text-[#1E1E1E]">{getContent(activeMenu)}</div>
        </div>

        {/* top Navigation Links */}
        <div className="flex gap-10 opacity-100">
          <button
            onClick={() => handleMenuClick('About Us')}
            className="text-white font-bold text-ms focus:outline-none"
          >
            About Us
          </button>
        
          <button
            onClick={() => handleMenuClick('Join Now')}
            className="text-white font-bold text-ms focus:outline-none"
          >
            Join Now
          </button>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
