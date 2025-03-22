'use client';
import { signIn } from "next-auth/react";
import Image from "next/image";

const Authen = () => {

  return (
    <div className="relative">
      <div className="flex justify-center mt-12">
        <div className="bg-white bg-opacity-70 p-12 px-16 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-2xl font-bold text-center mb-2">Login</h2>
          <p className="text-center font-semibold mb-6 text-gray-500">Please sign in to your account</p>



          <div className="my-4 text-center">
            <p className="text-sm text-gray-500">Available Provider</p>
            <div className="flex justify-center space-x-4 mt-2">
              <button
                onClick={() => signIn("google", { callbackUrl: "/project/list" })}
                className="flex flex-row w-full py-2 px-16 text-black rounded-lg border border-[#1E1E1E]"
              >
                <Image
                  src="/gmail.png"
                  alt="Google"
                  width={25}
                  height={25}
                  className="object-contain transition-transform duration-300 ease-in-out hover:rotate-[-12deg]"
                />
                <span className="font-medium ml-4">Google</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm">
              Don’t have an account?{' '}
              <a onClick={() => signIn("google", { callbackUrl: "/project/list" })} className="cursor-pointer text-blue-500 hover:underline">Request Now</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authen;
