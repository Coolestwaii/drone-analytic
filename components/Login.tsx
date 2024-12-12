// auth.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

const Authen = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="relative">
      <div className="flex justify-center mt-12">
        <div className="bg-white bg-opacity-70 p-12 px-16 rounded-lg shadow-lg max-w-sm w-full">
          {/* Header and Description */}
          <h2 className="text-2xl font-bold text-center mb-2">Login</h2>
          <p className="text-center font-semibold mb-6 text-gray-500">Sign in to your account</p>
          
          {/* Form */}
          <form>
            {/* Email / Phone No Input */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-left font-medium">Email / Phone No</label>
              <input
                type="text"
                id="email"
                placeholder="Enter your email or phone"
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Passcode Input */}
            <div className="mb-4">
              <label htmlFor="passcode" className="block text-left font-medium">Password</label>
              <div className="relative">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  id="passcode"
                  placeholder="Enter password"
                  className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {passwordVisible ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Trouble Sign In Link */}
            <div className="flex justify-between items-center mt-4">
              <a
                href="#"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full py-2 bg-[#D5EFB0] text-black font-medium rounded-lg focus:outline-none hover:bg-black hover:text-white mt-4"
            >
              Sign in
            </button>

            {/* Alternative Sign-in Options */}
            <div className="my-4 text-center">
              <p className="text-sm text-gray-500">Or Sign in with</p>
              <div className="flex justify-center space-x-4 mt-2">
                <button className="flex flex-row w-full py-2 px-16 text-black rounded-lg border border-[#1E1E1E]">
                    <Image
                    src="/gmail.png"
                    alt="drone"
                    width={25}
                    height={25}
                    className="object-contain transition-transform duration-300 ease-in-out hover:rotate-[-12deg]"
                    />
                  <span className="font-medium ml-4 ">Google</span>
                </button>
              </div>
            </div>

            {/* Request Now Link */}
            <div className="mt-4 text-center">
              <p className="text-sm">
                Don’t have an account?{' '}
                <a
                  href="#"
                  className="text-blue-500 hover:underline"
                >
                  Request Now
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Authen;
