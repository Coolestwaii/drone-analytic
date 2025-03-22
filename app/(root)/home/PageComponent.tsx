'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const Page = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Welcome to the Drone Analytic App!</h1>
      <p>This is the `/homepage` route in Next.js application.</p>
    </div>
  );
};

export default Page;
