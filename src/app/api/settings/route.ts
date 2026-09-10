import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'default_settings' },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: 'default_settings',
          companyName: 'ZD GOLD',
          tagline: 'Fine Gold Jewelry & 0% Interest Layaway',
          logoUrl: '',
          phone: '+63 (02) 8888-GOLD',
          email: 'inquiries@zdgold.ph',
          address: 'Metro Manila, Philippines',
          currencySymbol: '$',
          goldAccentColor: '#D4AF37',
          themeConfig: JSON.stringify({ maxCartQuantityPerItem: 50, maxCartTotalItems: 100 }),
        },
      });
    } else if (
      settings.companyName?.includes('DANICA') ||
      settings.tagline?.includes('Haute') ||
      settings.tagline?.includes('Certified Fine Gold House') ||
      settings.tagline?.includes('Vault') ||
      settings.tagline?.includes('Direct Fine Gold')
    ) {
      // Auto-migrate legacy DB record to ZD GOLD
      settings = await prisma.siteSettings.update({
        where: { id: 'default_settings' },
        data: {
          companyName: 'ZD GOLD',
          tagline: 'Fine Gold Jewelry & 0% Interest Layaway',
          email: 'inquiries@zdgold.ph',
        },
      });
    }

    let themeConfigObj: any = {};
    if (settings.themeConfig) {
      try {
        themeConfigObj = typeof settings.themeConfig === 'string' ? JSON.parse(settings.themeConfig) : settings.themeConfig;
      } catch {}
    }

    const companyName = settings.companyName?.includes('DANICA') ? 'ZD GOLD' : (settings.companyName || 'ZD GOLD');
    let tagline = settings.tagline || 'Fine Gold Jewelry & 0% Interest Layaway';
    if (
      tagline.includes('Haute') ||
      tagline.includes('Certified Fine Gold House') ||
      tagline.includes('Vault') ||
      tagline.includes('Direct Fine Gold')
    ) {
      tagline = 'Fine Gold Jewelry & 0% Interest Layaway';
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        companyName,
        tagline,
        logoUrl: settings.logoUrl || '',
        maxCartQuantityPerItem: themeConfigObj.maxCartQuantityPerItem ?? 50,
        maxCartTotalItems: themeConfigObj.maxCartTotalItems ?? 100,
      },
    });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      {
        success: true,
        settings: {
          companyName: 'ZD GOLD',
          tagline: 'Fine Gold Jewelry & 0% Interest Layaway',
          logoUrl: '',
          phone: '+63 (02) 8888-GOLD',
          email: 'inquiries@zdgold.ph',
          address: 'Metro Manila, Philippines',
          currencySymbol: '$',
          goldAccentColor: '#D4AF37',
          maxCartQuantityPerItem: 50,
          maxCartTotalItems: 100,
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      tagline,
      logoUrl,
      phone,
      email,
      address,
      currencySymbol,
      goldAccentColor,
      maxCartQuantityPerItem,
      maxCartTotalItems,
      themeConfig,
    } = body;

    let currentSettings = await prisma.siteSettings.findUnique({
      where: { id: 'default_settings' },
    });

    let currentThemeConfig: any = {};
    if (currentSettings?.themeConfig) {
      try {
        currentThemeConfig = typeof currentSettings.themeConfig === 'string' ? JSON.parse(currentSettings.themeConfig) : currentSettings.themeConfig;
      } catch {}
    }

    if (themeConfig) {
      try {
        const parsed = typeof themeConfig === 'string' ? JSON.parse(themeConfig) : themeConfig;
        currentThemeConfig = { ...currentThemeConfig, ...parsed };
      } catch {}
    }

    if (maxCartQuantityPerItem !== undefined) {
      currentThemeConfig.maxCartQuantityPerItem = Math.max(1, Number(maxCartQuantityPerItem) || 50);
    }
    if (maxCartTotalItems !== undefined) {
      currentThemeConfig.maxCartTotalItems = Math.max(1, Number(maxCartTotalItems) || 100);
    }

    const themeConfigStr = JSON.stringify(currentThemeConfig);

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'default_settings' },
      update: {
        companyName: companyName || 'ZD GOLD',
        tagline: tagline || 'Fine Gold Jewelry & 0% Interest Layaway',
        logoUrl: logoUrl !== undefined ? logoUrl : '',
        phone: phone || '+63 (02) 8888-GOLD',
        email: email || 'inquiries@zdgold.ph',
        address: address || 'Metro Manila, Philippines',
        currencySymbol: currencySymbol || '$',
        goldAccentColor: goldAccentColor || '#D4AF37',
        themeConfig: themeConfigStr,
      },
      create: {
        id: 'default_settings',
        companyName: companyName || 'ZD GOLD',
        tagline: tagline || 'Fine Gold Jewelry & 0% Interest Layaway',
        logoUrl: logoUrl || '',
        phone: phone || '+63 (02) 8888-GOLD',
        email: email || 'inquiries@zdgold.ph',
        address: address || 'Metro Manila, Philippines',
        currencySymbol: currencySymbol || '$',
        goldAccentColor: goldAccentColor || '#D4AF37',
        themeConfig: themeConfigStr,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Branding and store limitation settings updated successfully!',
      settings: {
        ...updated,
        maxCartQuantityPerItem: currentThemeConfig.maxCartQuantityPerItem ?? 50,
        maxCartTotalItems: currentThemeConfig.maxCartTotalItems ?? 100,
      },
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
