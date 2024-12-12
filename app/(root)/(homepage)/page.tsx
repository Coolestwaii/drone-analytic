'use client';

import Image from 'next/image';
import Link from 'next/link';

const Page = () => {
  return (
    <div className="">
      {/* section1 */}
      <div
        className="p-0 bg-cover bg-center min-h-screen relative snap-start transition-all ease-in duration-[500ms] scroll:h-[50vh]"
        style={{ backgroundImage: "url('/bg.png')" }}
      >
        <div className="flex items-center justify-center w-full h-screen">
          <div className="flex-shrink-0">
            <Image
              src="/drone.png"
              alt="drone"
              width={600}
              height={400}
              className="object-contain transition-transform duration-300 ease-in-out hover:rotate-[-12deg]"
            />
          </div>

          <div className="text-black ml-8">
            <h1 className="text-4xl font-bold">WELCOME TO DRONEGIS</h1>
            <p className="text-xl mt-4">Online platform for drone image processing</p>
            <div className="mt-6">
              <Link href="/login">
                <button className="bg-transparent font-semibold border-2 border-black py-2 px-16 rounded-[10px]">
                    LOGIN
                  </button>
              </Link>
              <Link href="/signup">
                <button className="bg-black text-white font-semibold py-2 px-16 rounded-[10px] ml-4">
                    SIGN UP
                  </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* section2 
      <div className="snap-start transition-all ease-in duration-[500ms]">
        <div
          className="p-0 bg-cover bg-center h-[50vh] relative"
          style={{
            backgroundImage: "url('/bg.png')",
            backgroundPosition: "bottom",
          }}
        >
          <div className="flex flex-col items-center justify-center text-black">
            <h1 className="text-4xl font-bold mt-[100px]">WELCOME TO DRONEGIS</h1>
            <p className="text-xl mt-4">Online platform for drone image processing</p>

            <div className="mt-6 flex space-x-4">
              <button className="bg-black text-white font-semibold py-2 px-16 rounded-[10px]">
                SIGN UP
              </button>
              <button className="bg-transparent font-semibold border-2 border-black py-2 px-16 rounded-[10px]">
                LOGIN
              </button>
            </div>
          </div>
        </div>

        <div className="p-0 bg-white bg-center h-[50vh] relative"></div>
      </div>*/}
    </div>
  );
};

export default Page;
