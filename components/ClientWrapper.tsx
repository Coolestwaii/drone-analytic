'use client';

export const dynamic = 'force-dynamic';

import { usePathname } from 'next/navigation';
import LeftSidebar from '@/components/LeftSidebar';
import Map from '@/components/Map';
import Navbar from './Navbar';
import React, { useState,useEffect } from 'react';
import L from 'leaflet';
import { mapCenterService } from '@/services/mapCenterService';

const ClientWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isProjectRoute = pathname?.startsWith('/project/') ?? false;

  // Manage the map center state
  const [mapCenter, setMapCenter] = useState<L.LatLngTuple>(mapCenterService.getCenter());

  useEffect(() => {
    const updateCenter = (newCenter: L.LatLngTuple) => {
      setMapCenter(newCenter);
    };

    // Subscribe to center updates
    mapCenterService.addListener(updateCenter);

    // Cleanup the listener on unmount
    return () => {
      mapCenterService.removeListener(updateCenter);
    };
  }, []);

  return (
    <div className="flex">
      {!isProjectRoute && <Navbar />}
      {isProjectRoute && <LeftSidebar child={children} />}
      <section className="flex min-h-screen w-full flex-col">
        {/* Pass the map center and its setter to children */}
        {isProjectRoute ? (
          <>
            <Map center={mapCenter} />
          </>
        ) : (
          children
        )}
      </section>
    </div>
  );
};

export default ClientWrapper;
