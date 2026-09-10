import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getAppOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0 && !envUrl.includes('localhost')) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim();
    return `${forwardedProto}://${host}`.replace(/\/+$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  }

  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const rawState = url.searchParams.get('state');

  let callbackUrl = '/account';
  if (rawState) {
    try {
      const decoded = JSON.parse(Buffer.from(rawState, 'base64').toString());
      if (decoded?.callbackUrl) {
        callbackUrl = decoded.callbackUrl;
      }
    } catch (e) {
      // Ignore invalid state
    }
  }

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=Missing+authorization+code', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=Google+OAuth+credentials+missing+in+server+config', request.url));
  }

  const origin = getAppOrigin(request);
  const redirectUri = `${origin}/api/auth/callback/google`;

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(tokenData.error_description || 'Failed to exchange Google token')}`, request.url)
      );
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await userInfoResponse.json();

    if (!userInfoResponse.ok || !profile.email) {
      console.error('Google user info error:', profile);
      return NextResponse.redirect(new URL('/login?error=Failed+to+fetch+Google+user+profile', request.url));
    }

    const email = profile.email.toLowerCase().trim();
    const name = profile.name || 'Google Customer';
    const avatar = profile.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400';

    // 3. Upsert user in Prisma PostgreSQL database
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        avatar: avatar || undefined,
      },
      create: {
        email,
        name,
        avatar,
        role: 'CUSTOMER',
        phone: '+63 917 000 0000',
        address: 'Metro Manila, Philippines',
        city: 'Metro Manila',
        zipCode: '1000',
      },
    });

    const clientUserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      zipCode: user.zipCode,
      avatar: user.avatar,
    };

    const sessionParam = encodeURIComponent(JSON.stringify(clientUserPayload));
    const targetParam = encodeURIComponent(callbackUrl);

    // Redirect to auth-callback client page to save session and continue
    return NextResponse.redirect(new URL(`/auth-callback?session=${sessionParam}&target=${targetParam}`, request.url));
  } catch (err: any) {
    console.error('Google OAuth callback handler error:', err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || 'Authentication error occurred')}`, request.url)
    );
  }
}
