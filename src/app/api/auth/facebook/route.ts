import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get('callbackUrl') || '/account';

  const clientId = process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=Facebook+App+ID+not+configured', request.url));
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback/facebook`;
  const state = Buffer.from(JSON.stringify({ callbackUrl })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email,public_profile',
    state,
  });

  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  return NextResponse.redirect(fbAuthUrl);
}
