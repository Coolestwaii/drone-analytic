import type { Metadata } from 'next';
import '../styles/globals.css';
import Navbar from '@/components/Navbar';
import LeftSidebar from '@/components/LeftSidebar';
import Map from '@/components/Map';

export const metadata: Metadata = {
  title: 'Drone Analytic',
  description: 'Drone Analytic website for blablablablas',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-200 relative">
        <Navbar />
        <div className="flex">
          {children && <LeftSidebar child={children} />}

          <section className="flex min-h-screen w-full flex-col">
            <Map />
          </section>
        </div>
      </body>
    </html>
  );
}
