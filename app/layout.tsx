import type { Metadata } from "next";
import "../styles/globals.css";
// import { navbarLinks } from "@/constant";
// import Link from "next/link";

export const metadata: Metadata = {
  title: "Drone Analytic",
  description: "Drone Analytic website for blablablablas",
  icons: {
    icon: "/assets/images/site-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-200">
      {children}
      <div className="h-2 w-full bg-green-500 sm:bg-yellow-500 md:bg-orange-500 lg:bg-red-500 sticky"></div>
      </body>
      {/* <footer className="row-start-3 flex gap-16 flex-wrap items-center justify-center">
      {navbarLinks.map((navlink,i) => {
  return (
    <Link key={i}
    href={navlink.url} className="flex items-center gap-2">
 <p className="text-black max-sm:hidden">
 {navlink.title}
 </p>
</Link>)
})}
      </footer> */}
    </html>
  );
}
