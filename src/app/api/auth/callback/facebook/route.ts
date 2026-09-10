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
    } catch (e) {}
  }

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=Missing+Facebook+authorization+code', request.url));
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/login?error=Facebook+OAuth+credentials+missing+in+server+config', request.url));
  }

  const origin = getAppOrigin(request);
  const redirectUri = `${origin}/api/auth/callback/facebook`;

  try {
    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${tokenParams.toString()}`);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Facebook token exchange error:', tokenData);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(tokenData.error?.message || 'Failed to exchange Facebook token')}`, request.url)
      );
    }

    // 2. Fetch user profile from Graph API
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`
    );
    const profile = await profileRes.json();

    if (!profileRes.ok) {
      console.error('Facebook profile error:', profile);
      return NextResponse.redirect(new URL('/login?error=Failed+to+fetch+Facebook+user+profile', request.url));
    }

    const email = (profile.email || `fb_${profile.id}@zdgold.ph`).toLowerCase().trim();
    const name = profile.name || 'Facebook Customer';
    const avatar =
      profile.picture?.data?.url ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';

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

    return NextResponse.redirect(new URL(`/auth-callback?session=${sessionParam}&target=${targetParam}`, request.url));
  } catch (err: any) {
    console.error('Facebook OAuth callback handler error:', err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || 'Authentication error occurred')}`, request.url)
    );
  }
}
