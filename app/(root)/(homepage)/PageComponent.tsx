'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
            <h1 className="text-4xl font-bold">Welcome to Drone Analytic</h1>
            <p className="text-xl mt-4">Online platform for Drone Image Analysis and Assessment </p>
            <div className="mt-6">
              <Link href="/login">
                <button className="bg-transparent font-semibold border-2 border-black py-2 px-16 rounded-[10px]">
                    LOGIN
                  </button>
              </Link>
              <Link href="/login">
                <button className="bg-black text-white font-semibold py-2 px-16 rounded-[10px] ml-4">
                    SIGN UP
                  </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Page;
