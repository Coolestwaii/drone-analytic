'use client';
import React from 'react';
import Link from 'next/link';
import { PiDroneDuotone } from 'react-icons/pi';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';

const Navbar = () => {
  return (
    <nav className="z-50 fixed w-full dark:shadow-none ">
      <div className="flex items-center justify-between rounded-xl px-3 py-2">
        <Link
          href="/"
          className="flex items-center gap-2 select-none bg-white rounded-md px-2"
        >
          <PiDroneDuotone className="text-5xl" />
          <p className="text-2xl font-bold text-black max-md:hidden">
            Drone<span className="text-emerald-500"> Analytic</span>
          </p>
        </Link>
        <div className="flex justify-end gap-7 ">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-white">About Us</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] bg-white overflow-y-auto max-h-[800px]">
              <div className="p-8 bg-white text-gray-900">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-4xl font-bold mb-6 text-center">
                    About Us
                  </h1>

                  {/* Mission Section */}
                  <section className="mb-10">
                    <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
                    <p className="text-lg leading-relaxed">
                      Our mission is to empower businesses and teams to achieve
                      their goals through streamlined project management
                      solutions. We focus on providing intuitive tools that
                      enhance productivity, improve collaboration, and ensure
                      successful project delivery.
                    </p>
                  </section>

                  {/* Technology Section */}
                  <section className="mb-10">
                    <h2 className="text-2xl font-semibold mb-3">Technology</h2>
                    <p className="text-lg leading-relaxed">
                      Our platform is built using the latest web technologies
                      including React, Next.js, and Node.js, ensuring top-notch
                      performance and scalability. We prioritize data security
                      and scalability, integrating with leading cloud providers
                      to deliver a reliable and secure experience for our users.
                    </p>
                  </section>

                  {/* Team Section */}
                  <section className="mb-10">
                    <h2 className="text-2xl font-semibold mb-3">
                      Meet the Team
                    </h2>
                    <p className="text-lg leading-relaxed mb-6">
                      We are a team of passionate professionals dedicated to
                      transforming how projects are managed. Our diverse
                      backgrounds, from software development to business
                      strategy, enable us to create solutions that meet the real
                      needs of project teams worldwide.
                    </p>

                    {/* Team Members */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="font-bold text-lg">John Doe</p>
                        <p className="text-sm text-gray-500">CEO & Founder</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">Jane Smith</p>
                        <p className="text-sm text-gray-500">CTO</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">Robert Johnson</p>
                        <p className="text-sm text-gray-500">Lead Developer</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
