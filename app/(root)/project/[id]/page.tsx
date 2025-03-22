'use client';
import dynamic from 'next/dynamic';

// 👇 Dynamically import with SSR disabled
const ProjectPage = dynamic(() => import('./ProjectPageComponent'), {
  ssr: false,
});

export default function Page() {
  return <ProjectPage />;
}
