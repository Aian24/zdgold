import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ success: false, error: 'User identifier required' }, { status: 400 });
    }

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        zipCode: user.zipCode || '',
        avatar: user.avatar || '',
      },
    });
  } catch (error: any) {
    console.error('Fetch user profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, email, name, phone, address, city, zipCode, avatar, password } = body;

    if (!id && !email) {
      return NextResponse.json({ success: false, error: 'User ID or Email is required' }, { status: 400 });
    }

    // Check if user exists
    let existingUser = null;
    if (id) {
      existingUser = await prisma.user.findUnique({ where: { id } });
    }
    if (!existingUser && email) {
      existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    }

    if (!existingUser) {
      // If user is from a social session not yet in DB, create it
      existingUser = await prisma.user.create({
        data: {
          id: id || undefined,
          email: (email || `user_${Date.now()}@danicagold.ph`).toLowerCase().trim(),
          name: name?.trim() || 'Client',
          phone: phone?.trim() || '+63 ',
          address: address?.trim() || '',
          city: city?.trim() || 'Metro Manila',
          zipCode: zipCode?.trim() || '',
          avatar: avatar || '',
          role: 'CUSTOMER',
        },
      });
    } else {
      // Update existing user
      existingUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name ? name.trim() : existingUser.name,
          phone: phone !== undefined ? phone.trim() : existingUser.phone,
          address: address !== undefined ? address.trim() : existingUser.address,
          city: city !== undefined ? city.trim() : existingUser.city,
          zipCode: zipCode !== undefined ? zipCode.trim() : existingUser.zipCode,
          avatar: avatar !== undefined ? avatar : existingUser.avatar,
          ...(password ? { password } : {}),
        },
      });
    }

    const clientUser = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      phone: existingUser.phone || '',
      address: existingUser.address || '',
      city: existingUser.city || '',
      zipCode: existingUser.zipCode || '',
      avatar: existingUser.avatar || '',
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: clientUser,
    });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
