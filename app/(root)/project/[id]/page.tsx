/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Separator } from '@/components/ui/separator';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { projects } from '@/constant';

const ProjectPage = () => {
  const { id } = useParams(); // Get the id from the URL
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    // Find the project based on the id from the URL
    const foundProject = projects.find((project) => project.id === id);
    if (foundProject) {
      setProject(foundProject);
    }
  }, [id]);

  // If no project is found, show a message
  if (!project) {
    return <p className="text-center text-red-500">Project not found !</p>;
  }

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
      <p className="text-lg mb-6">{project.description}</p>
      <p className="text-sm text-gray-500 mb-6">{project.date}</p>
      <Separator className="my-4 bg-black" />
      {/* Segmentation Section */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">Segmentation</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {project.segmentation.map((segment: any, index: number) => (
          <div key={index} className="flex flex-col items-center">
            <Image
              src={segment.image}
              alt={segment.item}
              unoptimized
              width={150}
              height={150}
            />
            <p className="mt-2">{segment.item}</p>
          </div>
        ))}
      </div>
      <Separator className="my-4 bg-black" />
      {/* GCPList Section */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">GCP List</h2>
      <ul className="list-disc list-inside">
        {project.GCPList.map((gcp: any, index: number) => (
          <li key={index} className="mb-2">
            {gcp.name} (X: {gcp.xAxis}, Y: {gcp.yAxis})
          </li>
        ))}
      </ul>
      <Separator className="my-4 bg-black" />
      {/* Map Section */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">Map Images</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {project.Map.map((mapItem: any, index: number) => (
          <div key={index} className="flex flex-col items-center">
            <Image
              src={mapItem.image}
              alt={mapItem.name}
              width={150}
              height={150}
              unoptimized
            />
            <p className="mt-2">{mapItem.name}</p>
          </div>
        ))}
      </div>
      <Separator className="my-4 bg-black" />
      {/* Measurement Section */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">Measurement</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {project.measurement.map((measure: any, index: number) => (
          <div key={index} className="flex flex-col items-center">
            <Image
              src={measure.image}
              alt={measure.item}
              width={150}
              height={150}
              unoptimized
            />
            <p className="mt-2">{measure.item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectPage;
