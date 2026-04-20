import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/sign-in';
  const isSetPasswordRoute = pathname === '/account/set-password';

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: access } = await supabase
      .from('user_access')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!access) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('error', 'no-access');
      return NextResponse.redirect(url);
    }

    const mustChange = user.user_metadata?.must_change_password === true;
    if (mustChange && !isSetPasswordRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/account/set-password';
      return NextResponse.redirect(url);
    }

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
