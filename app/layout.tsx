import type { Metadata } from 'next';
import '../styles/globals.css';
import ClientWrapper from '@/components/ClientWrapper';

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
        
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
