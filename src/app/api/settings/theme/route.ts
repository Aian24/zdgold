import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_THEME, ThemeConfig } from '@/lib/theme';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'default_settings' },
    });

    if (!settings || !settings.themeConfig || settings.themeConfig === '{}') {
      return NextResponse.json({
        success: true,
        theme: DEFAULT_THEME,
      });
    }

    try {
      const parsedTheme = JSON.parse(settings.themeConfig);
      return NextResponse.json({
        success: true,
        theme: { ...DEFAULT_THEME, ...parsedTheme },
      });
    } catch (e) {
      return NextResponse.json({
        success: true,
        theme: DEFAULT_THEME,
      });
    }
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    return NextResponse.json({
      success: true,
      theme: DEFAULT_THEME,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { theme } = body;

    if (!theme || typeof theme !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid theme configuration payload' },
        { status: 400 }
      );
    }

    const themeString = JSON.stringify(theme);
    const primaryColor = theme.primary || '#D4AF37';

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'default_settings' },
      update: {
        themeConfig: themeString,
        goldAccentColor: primaryColor,
      },
      create: {
        id: 'default_settings',
        companyName: 'ZD GOLD',
        tagline: 'Fine Gold Jewelry & 0% Interest Layaway',
        logoUrl: '',
        phone: '+63 (02) 8888-GOLD',
        email: 'inquiries@zdgold.ph',
        address: 'Metro Manila, Philippines',
        currencySymbol: '$',
        goldAccentColor: primaryColor,
        themeConfig: themeString,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Theme configuration saved successfully!',
      theme,
    });
  } catch (error) {
    console.error('Error saving theme settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to persist theme settings' },
      { status: 500 }
    );
  }
}
