'use client';
import dynamic from 'next/dynamic';

// 👇 Dynamically import with SSR disabled
const PagePage = dynamic(() => import('./PageComponent'), {
  ssr: false,
});

export default function Page() {
  return <PagePage />;
}
