import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        orders: {
          include: {
            payments: true,
          },
        },
        layawayContracts: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((user) => {
      const totalSpend = user.payments
        .filter((p) => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount, 0);

      const activeLayaways = user.layawayContracts.filter((c) => c.status === 'ACTIVE').length;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password: user.password || 'Aianbasagre24',
        address: user.address,
        city: user.city,
        zipCode: user.zipCode,
        totalOrders: user.orders.length,
        totalSpend,
        activeLayaways,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({ success: true, customers: formatted });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, zipCode, role = 'CUSTOMER', password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: password ? password.trim() : 'Aianbasagre24',
        phone: phone || null,
        address: address || null,
        city: city || null,
        zipCode: zipCode || null,
        role: role || 'CUSTOMER',
        avatar: role === 'ADMIN'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
      },
    });

    return NextResponse.json({
      success: true,
      message: `${role === 'ADMIN' ? 'Administrator' : 'Client'} registered successfully`,
      customer: newUser,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, phone, address, city, zipCode, role, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        password: password !== undefined && password !== '' ? password.trim() : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        zipCode: zipCode !== undefined ? zipCode : undefined,
        role: role || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
      customer: updated,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids') || searchParams.get('id');

    if (!idsParam) {
      return NextResponse.json(
        { success: false, error: 'Customer ID(s) required' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').filter(Boolean);

    await prisma.payment.deleteMany({ where: { userId: { in: ids } } });
    await prisma.installment.deleteMany({ where: { contract: { userId: { in: ids } } } });
    await prisma.layawayContract.deleteMany({ where: { userId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { order: { userId: { in: ids } } } });
    await prisma.order.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({
      success: true,
      message: `${ids.length} customer(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting customer(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer(s): ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
