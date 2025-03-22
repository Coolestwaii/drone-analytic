'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import Authen from "@/components/Login";

const Page = () => {
  return (
    
      <div
        className="bg-cover bg-center min-h-screen relative flex items-center justify-center"
        style={{ backgroundImage: "url('/bg.png')" }}
      >
        <div className="flex flex-col items-center text-center text-black space-y-6 relative z-10">
        <Authen></Authen>
      </div>
    </div>
  );
};

export default Page;
