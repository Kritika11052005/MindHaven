// components/RouteProtector.tsx

"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '../lib/context/sessionContext';
import { checkRouteAccess } from '../lib/config/protectedRoutes';

interface RouteProtectorProps {
  children: React.ReactNode;
}

export default function RouteProtector({ children }: RouteProtectorProps) {
  const { isAuthenticated, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't check routes while session is loading
    if (loading) return;

    console.log('RouteProtector: Checking access for:', pathname);
    console.log('RouteProtector: isAuthenticated:', isAuthenticated);

    const { allowed, redirectTo } = checkRouteAccess(pathname, isAuthenticated);

    if (!allowed && redirectTo) {
      console.log('RouteProtector: Redirecting to:', redirectTo);
      router.push(redirectTo);
    }
  }, [pathname, isAuthenticated, loading, router]);

  // Show loading spinner while checking session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Alternative: Higher-Order Component approach
export function withRouteProtection<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth: boolean = true
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, loading } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (loading) return;

      if (requireAuth && !isAuthenticated) {
        router.push('/login');
      } else if (!requireAuth && isAuthenticated && ['/login', '/signup'].includes(pathname)) {
        router.push('/dashboard');
      }
    }, [isAuthenticated, loading, pathname, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (requireAuth && !isAuthenticated) {
      return null; // or loading component
    }

    return <Component {...props} />;
  };
}
