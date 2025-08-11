// lib/config/protectedRoutes.ts

export interface RouteConfig {
    path: string;
    isProtected: boolean;
    redirectTo?: string;
}

// Define your routes - simplified to just what you need
export const routeConfig: RouteConfig[] = [
    // Unprotected routes (public access)
    { path: '/', isProtected: false },
    { path: '/login', isProtected: false },
    { path: '/signup', isProtected: false },
    { path: '/forgot-password', isProtected: false },
    { path: '/reset-password', isProtected: false },
    { path: '/about', isProtected: false },
    { path: '/features', isProtected: false },

    // Protected routes (require authentication)
    { path: '/dashboard', isProtected: true, redirectTo: '/login' },
    { path: '/therapy', isProtected: true, redirectTo: '/login' }, // This covers /therapy/[sessionId] too
];

// Helper functions
export const isRouteProtected = (pathname: string): boolean => {
    // Check exact match first
    const exactMatch = routeConfig.find(route => route.path === pathname);
    if (exactMatch) {
        return exactMatch.isProtected;
    }

    // Check for partial matches (e.g., /therapy/sessions/123)
    const partialMatch = routeConfig.find(route =>
        pathname.startsWith(route.path) && route.path !== '/'
    );

    return partialMatch ? partialMatch.isProtected : true; // Default to protected for unknown routes
};

export const getRedirectPath = (pathname: string): string => {
    const route = routeConfig.find(route =>
        route.path === pathname || (pathname.startsWith(route.path) && route.path !== '/')
    );

    return route?.redirectTo || '/login';
};

// Predefined route groups for easier management
export const UNPROTECTED_ROUTES = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/about',
    '/features'
];

export const PROTECTED_ROUTE_PREFIXES = [
    '/dashboard',
    '/therapy',
    
];

// Simple checker functions
export const isPublicRoute = (pathname: string): boolean => {
    return UNPROTECTED_ROUTES.includes(pathname);
};

export const isProtectedRoute = (pathname: string): boolean => {
    return PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
};

// Route protection utility
export const checkRouteAccess = (pathname: string, isAuthenticated: boolean) => {
    const isProtected = isRouteProtected(pathname);

    if (isProtected && !isAuthenticated) {
        return {
            allowed: false,
            redirectTo: getRedirectPath(pathname)
        };
    }

    // If user is authenticated and trying to access login/signup, redirect to dashboard
    if (isAuthenticated && ['/login', '/signup'].includes(pathname)) {
        return {
            allowed: false,
            redirectTo: '/dashboard'
        };
    }

    return {
        allowed: true,
        redirectTo: null
    };
};