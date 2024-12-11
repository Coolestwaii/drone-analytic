'use client'; // This makes the component a Client Component

import Image from 'next/image';

const Page = () => {
  return (
    <div
      className="p-0 bg-cover bg-center min-h-screen relative"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <div className="flex items-center justify-start w-full h-full px-4">
        
        <div className="flex-shrink-0">
          <Image
            src="/drone.png"
            alt="drone"
            width={800}
            height={400}
            className="object-contain"
          />
        </div>

        <div className="text-black ml-8">
          <h1 className="text-4xl font-bold ">WELCOME TO DRONEGIS</h1>
          <p className="text-xl  mt-4">Online platform for drone image processing</p>
          <div className="mt-6">
            <button className="bg-black text-white font-semibold py-2 px-16 rounded-[10px] mr-4">SIGN UP</button>
            <button className="bg-transparent font-semibold border-2 border-black py-2 px-16 rounded-[10px]">LOGIN</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
