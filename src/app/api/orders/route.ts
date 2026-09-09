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

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
        layawayContract: {
          include: {
            installments: {
              orderBy: { installmentNumber: 'asc' },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
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
      city,
      items,
      orderType = 'CASH',
      status = 'CONFIRMED',
      paymentMethod = 'CASH',
      isPaid = true,
      courier = 'Store Counter Handover',
      trackingNumber,
      // Layaway specific parameters:
      downPaymentAmount = 0,
      downPaymentPercent,
      termMonths = 2,
      frequency = 'MONTHLY',
      startDate,
      installments = [],
    } = body;

    if (!customerName || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer name and at least one item are required.' },
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
            city: city || 'Manila',
            role: 'CUSTOMER',
          },
        });
      }
    }

    // 2. Ensure default product exists if custom item
    let defaultProduct = await prisma.product.findFirst();
    if (!defaultProduct) {
      defaultProduct = await prisma.product.create({
        data: {
          name: 'Custom Fine Gold Jewelry',
          slug: `custom-gold-${Date.now()}`,
          description: 'Custom fine gold jewelry order entry',
          category: 'RINGS',
          karat: '18K',
          purityPercentage: 0.750,
          weightGrams: 5.0,
          craftFee: 0,
          basePrice: 20000,
          stockQuantity: 50,
          images: JSON.stringify(['/images/jewelry-placeholder.png']),
        },
      });
    }

    // 3. Totals
    const totalAmount = items.reduce((sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
    const totalWeightGrams = items.reduce((sum: number, it: any) => sum + (Number(it.weightGrams) || 0) * (Number(it.quantity) || 1), 0);
    const craftFeeTotal = items.reduce((sum: number, it: any) => sum + (Number(it.craftFee) || 0) * (Number(it.quantity) || 1), 0);

    const seq = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DG-${new Date().getFullYear()}-${seq}`;
    const contractNumber = `LAY-2026-${seq}`;

    // 4. Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        orderType,
        status: orderType === 'LAYAWAY' ? 'PROCESSING' : status,
        totalGoldWeightGrams: totalWeightGrams,
        subtotal: totalAmount,
        craftFeeTotal,
        tax: 0,
        totalAmount,
        shippingAddress: shippingAddress || (orderType === 'LAYAWAY' ? 'Secured Vault Storage (Until Fully Paid)' : 'Store Counter Release'),
        city: city || 'Metro Manila',
        courier: courier || (orderType === 'LAYAWAY' ? 'Secured Vault Storage' : 'Store Handover'),
        trackingNumber: trackingNumber || undefined,
        orderItems: {
          create: items.map((it: any) => ({
            productId: it.productId || defaultProduct.id,
            quantity: Number(it.quantity) || 1,
            lockedGoldPricePerGram: it.lockedPricePerGram || 3640.0,
            karat: it.karat || '18K',
            weightGrams: Number(it.weightGrams) || 0,
            craftFee: Number(it.craftFee) || 0,
            unitPrice: Number(it.price) || 0,
            totalPrice: (Number(it.price) || 0) * (Number(it.quantity) || 1),
          })),
        },
      },
    });

    // 5. If Layaway, create LayawayContract and Installments
    if (orderType === 'LAYAWAY') {
      const dp = Number(downPaymentAmount) || 0;
      const remainingBalance = Math.max(0, totalAmount - dp);
      const months = Number(termMonths) || 2;

      // Auto generate installments if none provided
      let instList = installments;
      if (!instList || instList.length === 0) {
        const count = months * (frequency === 'TWICE_MONTHLY' ? 2 : frequency === 'WEEKLY' ? 4 : 1);
        const equalAmount = count > 0 ? Number((remainingBalance / count).toFixed(2)) : 0;
        const start = new Date(startDate || new Date());
        instList = [];

        for (let i = 1; i <= count; i++) {
          const nextDate = new Date(start);
          if (frequency === 'MONTHLY') {
            nextDate.setMonth(start.getMonth() + i);
          } else if (frequency === 'TWICE_MONTHLY') {
            nextDate.setDate(start.getDate() + i * 15);
          } else if (frequency === 'WEEKLY') {
            nextDate.setDate(start.getDate() + i * 7);
          }

          const dateStr = nextDate.toISOString().split('T')[0];
          const amt = i === count ? Number((remainingBalance - equalAmount * (count - 1)).toFixed(2)) : equalAmount;

          instList.push({
            installmentNumber: i,
            dueDate: dateStr,
            amountDue: amt,
            status: 'PENDING',
          });
        }
      }

      const firstDueDate = instList[0]?.dueDate ? new Date(instList[0].dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const finalDueDate = instList.length > 0 ? new Date(instList[instList.length - 1].dueDate) : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);

      const contract = await prisma.layawayContract.create({
        data: {
          contractNumber,
          orderId: order.id,
          userId: user.id,
          totalAmount,
          downPaymentAmount: dp,
          downPaymentPercent: downPaymentPercent || (dp > 0 ? Math.round((dp / totalAmount) * 100) : 0),
          remainingBalance,
          termMonths: months,
          monthlyInstallment: instList[0]?.amountDue || (remainingBalance / (months || 1)),
          lockedGoldSpotRate: 3640.00,
          status: remainingBalance <= 0 ? 'COMPLETED' : 'ACTIVE',
          startDate: startDate ? new Date(startDate) : new Date(),
          dueDate: finalDueDate,
          nextDueDate: firstDueDate,
          notes: `Manual Layaway order created (${months} Months - ${frequency})`,
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

      // Record Down payment
      if (dp > 0) {
        await prisma.payment.create({
          data: {
            paymentNumber: `PAY-DP-${seq}`,
            invoiceNumber: orderNumber,
            userId: user.id,
            orderId: order.id,
            contractId: contract.id,
            amount: dp,
            paymentMethod,
            paymentType: 'DOWN_PAYMENT',
            status: 'SUCCESS',
            referenceCode: `DP-${seq}`,
            notes: `Downpayment for ${months}-Month Layaway Plan`,
          },
        });
      }
    } else {
      // 6. Full Cash Payment record if paid
      if (isPaid && totalAmount > 0) {
        await prisma.payment.create({
          data: {
            paymentNumber: `PAY-2026-${seq}`,
            invoiceNumber: orderNumber,
            userId: user.id,
            orderId: order.id,
            amount: totalAmount,
            paymentMethod,
            paymentType: 'FULL_ORDER',
            status: 'SUCCESS',
            referenceCode: `REF-${seq}`,
            notes: 'Manual admin cash order payment recorded',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: orderType === 'LAYAWAY' ? 'Layaway order & contract created successfully' : 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Error creating manual order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order: ' + String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      status,
      trackingNumber,
      courier,
      shippingAddress,
      totalAmount,
      customerName,
      customerPhone,
      customerEmail,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update user info if provided
    if (customerName || customerPhone || customerEmail) {
      await prisma.user.update({
        where: { id: order.userId },
        data: {
          name: customerName || undefined,
          phone: customerPhone || undefined,
          email: customerEmail || undefined,
        },
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status || undefined,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
        courier: courier !== undefined ? courier : undefined,
        shippingAddress: shippingAddress !== undefined ? shippingAddress : undefined,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : undefined,
      },
      include: {
        user: true,
        orderItems: { include: { product: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updated,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
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
        { success: false, error: 'Order ID(s) required' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').filter(Boolean);

    // Cascade delete payments, items, layaway, and orders
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.installment.deleteMany({
      where: {
        contract: {
          orderId: { in: ids },
        },
      },
    });
    await prisma.layawayContract.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({
      success: true,
      message: `${ids.length} order(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting order(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order(s)' },
      { status: 500 }
    );
  }
}
