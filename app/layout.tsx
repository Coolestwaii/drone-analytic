import type { Metadata } from 'next';
import '../styles/globals.css';
import ClientWrapper from '@/components/ClientWrapper';
import SessionProviderWrapper from '@/components/SessionProviderWrapper'; // Import the wrapper

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
          <SessionProviderWrapper>
          <ClientWrapper>{children}

          </ClientWrapper>
        </SessionProviderWrapper>


      </body>
    </html>
  );
}
