'use client';

import dynamic from 'next/dynamic';
import { useEffect,useState } from 'react';

const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <>{children}</>;
};

// 👇 Dynamically import with SSR disabled
const ProjectList = dynamic(() => import('./ProjectListComponent'), {
  ssr: false,
});

export default function Page() {
  return <ClientOnly>
          <ProjectList />
        </ClientOnly>
}


