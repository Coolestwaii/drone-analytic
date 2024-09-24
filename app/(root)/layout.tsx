
import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import React from "react";
import bgImage from "@/app/images/bg.png"; 

const layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <main className="relative" style={{
      backgroundImage: `url(${bgImage.src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <Navbar />
      <div className="flex">
        <LeftSidebar />
        <section className="flex min-h-screen w-full flex-col pt-32">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default layout;
