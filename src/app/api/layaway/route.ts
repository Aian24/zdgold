import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: any = {};
    if (userId) where.userId = userId;
    if (status && status !== 'ALL') where.status = status;

    const contracts = await prisma.layawayContract.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, contracts });
  } catch (error) {
    console.error('Error fetching layaway contracts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layaway contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      totalAmount,
      downPaymentAmount,
      downPaymentPercent,
      termMonths = 6,
      frequency = 'TWICE_MONTHLY',
      startDate,
      installments,
      paymentMethod = 'GCASH',
      notes,
    } = body;

    if (!customerName || !totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Customer name and total amount are required.' },
        { status: 400 }
      );
    }

    // 1. Resolve User
    let user = null;
    if (userId && userId !== 'custom') {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      const email = customerEmail || `client-${Date.now()}@danicagold.local`;
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: customerName,
            email,
            phone: customerPhone || 'N/A',
            address: shippingAddress || 'Store Pickup',
            role: 'CUSTOMER',
          },
        });
      }
    }

    // 2. Default product if items not mapped
    let defaultProduct = await prisma.product.findFirst();
    if (!defaultProduct) {
      defaultProduct = await prisma.product.create({
        data: {
          name: 'Custom Fine Gold Layaway Item',
          slug: `custom-layaway-${Date.now()}`,
          description: 'Custom fine gold layaway contract entry',
          category: 'NECKLACES',
          karat: '18K',
          purityPercentage: 0.750,
          weightGrams: 10.0,
          craftFee: 0,
          basePrice: totalAmount,
          stockQuantity: 50,
          images: JSON.stringify(['/images/jewelry-placeholder.png']),
        },
      });
    }

    const seq = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DG-LAY-${seq}`;
    const contractNumber = `LAY-2026-${seq}`;

    const orderItemsList = (items && items.length > 0) ? items : [
      {
        name: 'Custom Layaway Gold Item',
        karat: '18K',
        weightGrams: 10.0,
        craftFee: 0,
        price: totalAmount,
        quantity: 1,
      },
    ];

    const totalWeightGrams = orderItemsList.reduce((sum: number, it: any) => sum + (Number(it.weightGrams) || 0) * (Number(it.quantity) || 1), 0);

    // 3. Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        orderType: 'LAYAWAY',
        status: 'PROCESSING',
        totalGoldWeightGrams: totalWeightGrams,
        subtotal: totalAmount,
        craftFeeTotal: 0,
        tax: 0,
        totalAmount,
        shippingAddress: shippingAddress || 'Secured Vault Storage (Until Completed)',
        city: 'Metro Manila',
        courier: 'Secured Vault Storage',
        orderItems: {
          create: orderItemsList.map((it: any) => ({
            productId: it.productId || defaultProduct.id,
            quantity: Number(it.quantity) || 1,
            lockedGoldPricePerGram: 3640.0,
            karat: it.karat || '18K',
            weightGrams: Number(it.weightGrams) || 0,
            craftFee: Number(it.craftFee) || 0,
            unitPrice: Number(it.price) || 0,
            totalPrice: (Number(it.price) || 0) * (Number(it.quantity) || 1),
          })),
        },
      },
    });

    const dp = Number(downPaymentAmount) || 0;
    const remainingBalance = Math.max(0, totalAmount - dp);
    const instList = installments && installments.length > 0 ? installments : [];

    const firstDueDate = instList[0]?.dueDate ? new Date(instList[0].dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const finalDueDate = instList.length > 0 ? new Date(instList[instList.length - 1].dueDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // 4. Create Layaway Contract
    const contract = await prisma.layawayContract.create({
      data: {
        contractNumber,
        orderId: order.id,
        userId: user.id,
        totalAmount,
        downPaymentAmount: dp,
        downPaymentPercent: downPaymentPercent || (dp > 0 ? Math.round((dp / totalAmount) * 100) : 0),
        remainingBalance,
        termMonths: Number(termMonths) || instList.length || 3,
        monthlyInstallment: instList[0]?.amountDue || (remainingBalance / (instList.length || 1)),
        lockedGoldSpotRate: 3640.00,
        status: remainingBalance <= 0 ? 'COMPLETED' : 'ACTIVE',
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: finalDueDate,
        nextDueDate: firstDueDate,
        notes: notes || `Admin created 0% layaway contract (${frequency})`,
        installments: {
          create: instList.map((inst: any, idx: number) => ({
            installmentNumber: inst.installmentNumber || idx + 1,
            dueDate: new Date(inst.dueDate),
            amountDue: Number(inst.amountDue) || 0,
            amountPaid: inst.status === 'PAID' ? Number(inst.amountDue) : 0,
            status: inst.status || 'PENDING',
            paidAt: inst.status === 'PAID' ? new Date() : null,
            receiptNumber: `REC-${seq}-${idx + 1}`,
          })),
        },
      },
    });

    // 5. Downpayment payment record
    if (dp > 0) {
      await prisma.payment.create({
        data: {
          paymentNumber: `PAY-DP-${seq}`,
          invoiceNumber: contractNumber,
          userId: user.id,
          orderId: order.id,
          contractId: contract.id,
          amount: dp,
          paymentMethod,
          paymentType: 'DOWN_PAYMENT',
          status: 'SUCCESS',
          referenceCode: `DP-${seq}`,
          notes: 'Initial layaway down payment received',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Layaway contract created successfully',
      contract,
      order,
    });
  } catch (error) {
    console.error('Error creating layaway contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create layaway: ' + String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      contractId,
      status,
      notes,
      totalAmount,
      remainingBalance,
      customerName,
      customerPhone,
    } = body;

    if (!contractId) {
      return NextResponse.json(
        { success: false, error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    const contract = await prisma.layawayContract.findUnique({
      where: { id: contractId },
      include: { user: true, order: true },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (customerName || customerPhone) {
      await prisma.user.update({
        where: { id: contract.userId },
        data: {
          name: customerName || undefined,
          phone: customerPhone || undefined,
        },
      });
    }

    const updated = await prisma.layawayContract.update({
      where: { id: contractId },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
        remainingBalance: remainingBalance !== undefined ? parseFloat(remainingBalance) : undefined,
      },
      include: {
        user: true,
        order: { include: { orderItems: { include: { product: true } } } },
        installments: true,
        payments: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Layaway contract updated successfully',
      contract: updated,
    });
  } catch (error) {
    console.error('Error updating layaway contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update layaway contract' },
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
        { success: false, error: 'Contract ID(s) required' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').filter(Boolean);

    const contracts = await prisma.layawayContract.findMany({
      where: { id: { in: ids } },
    });

    const orderIds = contracts.map((c) => c.orderId).filter(Boolean);

    await prisma.payment.deleteMany({ where: { contractId: { in: ids } } });
    await prisma.installment.deleteMany({ where: { contractId: { in: ids } } });
    await prisma.layawayContract.deleteMany({ where: { id: { in: ids } } });

    if (orderIds.length > 0) {
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }

    return NextResponse.json({
      success: true,
      message: `${ids.length} layaway contract(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting layaway contract(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contract(s)' },
      { status: 500 }
    );
  }
}
