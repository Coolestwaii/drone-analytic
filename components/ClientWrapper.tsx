'use client';

import { usePathname } from 'next/navigation';
import LeftSidebar from '@/components/LeftSidebar';
import Map from '@/components/Map';
import Navbar from './Navbar';

const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isProjectRoute = pathname.startsWith('/project/');

  return (
    <div className="flex">
      {!isProjectRoute && <Navbar />}
      {isProjectRoute && <LeftSidebar child={children} />}
      <section className="flex min-h-screen w-full flex-col">
        {isProjectRoute ? <Map /> : children}
      </section>
    </div>
  );
};

export default ClientWrapper;
