//components/Login.tsx
'use client';
import { signIn } from "next-auth/react";
import { useState, FormEvent } from "react";
import Image from "next/image";

const Authen = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Placeholder for authentication logic
      console.log("Signing in with:", email, password);
      // Implement signIn logic here if required
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-center mt-12">
        <div className="bg-white bg-opacity-70 p-12 px-16 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-2xl font-bold text-center mb-2">Login</h2>
          <p className="text-center font-semibold mb-6 text-gray-500">Sign in to your account</p>
          {error && <p className="text-red-500 text-center">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-left font-medium">Email / Phone No</label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or phone"
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5EFB0]"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-left font-medium">Password</label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D5EFB0]"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {passwordVisible ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <a href="#" className="text-sm text-blue-500 hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#D5EFB0] text-black font-medium rounded-lg focus:outline-none hover:bg-black hover:text-white mt-4"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-4 text-center">
            <p className="text-sm text-gray-500">Or Sign in with</p>
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
              <a href="#" className="text-blue-500 hover:underline">Request Now</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authen;
