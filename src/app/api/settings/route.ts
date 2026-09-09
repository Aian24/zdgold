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
          companyName: 'DANICA GOLD PHILIPPINES',
          tagline: 'Haute Joaillerie & Certified Fine Gold House',
          logoUrl: '',
          phone: '+63 (02) 8888-GOLD / +63 917 123 4567',
          email: 'inquiries@danicagold.ph',
          address: 'Greenhills Mall / Ongpin St, Binondo, Manila, Philippines',
          currencySymbol: '₱',
          goldAccentColor: '#D4AF37',
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      {
        success: true,
        settings: {
          companyName: 'DANICA GOLD PHILIPPINES',
          tagline: 'Haute Joaillerie & Certified Fine Gold House',
          logoUrl: '',
          phone: '+63 (02) 8888-GOLD / +63 917 123 4567',
          email: 'inquiries@danicagold.ph',
          address: 'Greenhills Mall / Ongpin St, Binondo, Manila, Philippines',
          currencySymbol: '₱',
          goldAccentColor: '#D4AF37',
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
    } = body;

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'default_settings' },
      update: {
        companyName: companyName || 'DANICA GOLD PHILIPPINES',
        tagline: tagline || 'Haute Joaillerie & Certified Fine Gold House',
        logoUrl: logoUrl !== undefined ? logoUrl : '',
        phone: phone || '+63 (02) 8888-GOLD',
        email: email || 'inquiries@danicagold.ph',
        address: address || 'Greenhills Mall / Ongpin St, Binondo, Manila, Philippines',
        currencySymbol: currencySymbol || '₱',
        goldAccentColor: goldAccentColor || '#D4AF37',
      },
      create: {
        id: 'default_settings',
        companyName: companyName || 'DANICA GOLD PHILIPPINES',
        tagline: tagline || 'Haute Joaillerie & Certified Fine Gold House',
        logoUrl: logoUrl || '',
        phone: phone || '+63 (02) 8888-GOLD',
        email: email || 'inquiries@danicagold.ph',
        address: address || 'Greenhills Mall / Ongpin St, Binondo, Manila, Philippines',
        currencySymbol: currencySymbol || '₱',
        goldAccentColor: goldAccentColor || '#D4AF37',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Branding and theme settings updated successfully!',
      settings: updated,
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
