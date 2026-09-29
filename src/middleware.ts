import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  try {
    const host = request.headers.get('host') || '';
    const { pathname } = request.nextUrl;

    // Support admin.ghostalts.shop, admin.ghostalts.net or admin.localhost subdomain
    if (
      host.startsWith('admin.ghostalts.shop') ||
      host.startsWith('admin.ghostalts.net') ||
      host.startsWith('admin.localhost')
    ) {
      if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/auth') && !pathname.startsWith('/_next')) {
        const url = request.nextUrl.clone();
        url.pathname = `/admin${pathname === '/' ? '' : pathname}`;
        return NextResponse.rewrite(url);
      }
    }

    return await updateSession(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, png, svg, jpg
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

