import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/auth';
  
  // 1. User is NOT authenticated (No role cookie)
  if (!role) {
    if (isLoginPage) {
      return NextResponse.next();
    }
    // Redirect all protected role-based paths to /auth
    const protectedPaths = ['/teacher', '/parent', '/mentor', '/admin'];
    if (protectedPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  // 2. User is authenticated (Role cookie exists)
  if (role) {
    // If trying to access /auth while logged in, go to dashboard
    if (isLoginPage) {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }

    // Role-based authorization: Prevent accessing other roles' folders
    const roles = ['teacher', 'parent', 'mentor', 'admin'];
    const currentPathRole = roles.find(r => pathname.startsWith(`/${r}`));
    
    if (currentPathRole && currentPathRole !== role) {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
  }

  return NextResponse.next();
}

// Optimized matcher to exclude public files, api, and internal next assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|svg).*)',
  ],
};