import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow login and auth callback routes through
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // Build Supabase client that reads/writes cookies on the request
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Write refreshed cookies back to the request and response
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // getUser() validates the JWT on the Supabase side — safe and accurate
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // If no valid user → hard redirect to /login
    if (!user || error) {
        const loginUrl = new URL('/login', request.url);
        // Preserve where they were trying to go so we can redirect back later
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

// Run on every route except static assets
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
