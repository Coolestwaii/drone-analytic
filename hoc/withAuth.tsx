'use client';

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const withAuth = (WrappedComponent: React.FC) => {
  return function AuthenticatedComponent(props: React.ComponentProps<typeof WrappedComponent>) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
      if (status === "unauthenticated") {
        router.push("/login"); // Redirect to login page if not authenticated
      }
    }, [status, router]);

    if (status === "loading") {
      return <p>Loading...</p>; // Show loading state while checking session
    }

    return session ? <WrappedComponent {...props} /> : null;
  };
};

export default withAuth;
