import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, address: true },
        },
        orderItems: {
          include: { product: true },
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
      take: 50,
    });

    let filtered = orders;
    if (search) {
      filtered = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.user?.name.toLowerCase().includes(search) ||
          o.user?.email.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, receipts: filtered });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch receipts ledger' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      client,
      transactionType,
      items,
      pricing,
      layawayTerms,
      paymentDetails,
    } = body;

    if (!client?.name || !pricing?.totalAmount || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Client name, items, and total amount are required.' },
        { status: 400 }
      );
    }

    // 1. Resolve or create user
    let user = null;
    if (client.userId) {
      user = await prisma.user.findUnique({ where: { id: client.userId } });
    }

    if (!user) {
      const email = client.email || `walkin-${Date.now()}@zdgold.local`;
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: client.name,
            email,
            phone: client.phone || 'N/A',
            address: client.address || 'Walk-in Store Purchase',
            role: 'CUSTOMER',
          },
        });
      }
    }

    // 2. Find or create default product reference if custom item
    let defaultProduct = await prisma.product.findFirst();
    if (!defaultProduct) {
      defaultProduct = await prisma.product.create({
        data: {
          name: 'Custom Fine Gold Jewelry',
          slug: `custom-gold-${Date.now()}`,
          description: 'Bespoke fine gold jewelry custom manual receipt entry',
          category: 'JEWELRY',
          karat: '18K',
          purityPercentage: 0.750,
          weightGrams: pricing.totalWeightGrams || 10.0,
          craftFee: 0,
          basePrice: pricing.totalAmount,
          stockQuantity: 100,
          images: JSON.stringify(['/images/jewelry-placeholder.png']),
        },
      });
    }

    // 3. Generate receipt / order number
    const seq = Math.floor(1000 + Math.random() * 9000);
    let orderNumber = paymentDetails?.receiptNumber || `DG-OR-2026-${seq}`;
    let contractNumber = `LAY-2026-${seq}`;
    let paymentNumber = `PAY-2026-${seq}`;

    // Verify orderNumber uniqueness
    const existingOrder = await prisma.order.findUnique({ where: { orderNumber } });
    if (existingOrder) {
      orderNumber = `${orderNumber}-${Date.now().toString().slice(-4)}`;
    }

    const existingContract = await prisma.layawayContract.findUnique({ where: { contractNumber } });
    if (existingContract) {
      contractNumber = `${contractNumber}-${Date.now().toString().slice(-4)}`;
    }

    const existingPayment = await prisma.payment.findUnique({ where: { paymentNumber } });
    if (existingPayment) {
      paymentNumber = `${paymentNumber}-${Date.now().toString().slice(-4)}`;
    }

    // 4. Create Order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        orderType: transactionType === 'LAYAWAY' ? 'LAYAWAY' : 'CASH',
        status: transactionType === 'LAYAWAY' ? 'PROCESSING' : 'DELIVERED',
        totalGoldWeightGrams: pricing.totalWeightGrams || 0,
        subtotal: pricing.subtotal || pricing.totalAmount,
        craftFeeTotal: pricing.craftFeeTotal || 0,
        tax: pricing.tax || 0,
        totalAmount: pricing.totalAmount,
        shippingAddress: client.address || 'Walk-in Over-The-Counter Release',
        city: client.city || 'Flagship Store',
        courier: 'Over-The-Counter Handover / Secured Vault',
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId || defaultProduct.id,
            quantity: item.quantity || 1,
            lockedGoldPricePerGram: item.lockedSpotRate || 4850.00,
            karat: item.karat || '18K',
            weightGrams: item.weightGrams || 0,
            craftFee: item.craftFee || 0,
            unitPrice: item.price || 0,
            totalPrice: (item.price || 0) * (item.quantity || 1),
          })),
        },
      },
    });

    // 5. If Layaway, create LayawayContract and Installments
    let layawayContract = null;
    if (transactionType === 'LAYAWAY') {
      const downPaymentAmount = pricing.downPaymentAmount || 0;
      const remainingBalance = pricing.remainingBalance || (pricing.totalAmount - downPaymentAmount);
      const termMonths = layawayTerms?.termMonths || layawayTerms?.installments?.length || 3;
      const monthlyInstallment = layawayTerms?.installments?.[0]?.amountDue || (remainingBalance / (termMonths || 1));

      const firstDueDate = layawayTerms?.installments?.[0]?.dueDate
        ? new Date(layawayTerms.installments[0].dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const finalDueDate = layawayTerms?.installments?.length
        ? new Date(layawayTerms.installments[layawayTerms.installments.length - 1].dueDate)
        : new Date(Date.now() + termMonths * 30 * 24 * 60 * 60 * 1000);

      layawayContract = await prisma.layawayContract.create({
        data: {
          contractNumber,
          orderId: order.id,
          userId: user.id,
          totalAmount: pricing.totalAmount,
          downPaymentAmount,
          downPaymentPercent: pricing.downPaymentPercent || (downPaymentAmount > 0 ? Math.round((downPaymentAmount / pricing.totalAmount) * 100) : 0),
          remainingBalance,
          termMonths,
          monthlyInstallment,
          lockedGoldSpotRate: items[0]?.lockedSpotRate || 4850.00,
          status: remainingBalance <= 0 ? 'COMPLETED' : 'ACTIVE',
          startDate: layawayTerms?.startDate ? new Date(layawayTerms.startDate) : new Date(),
          dueDate: finalDueDate,
          nextDueDate: firstDueDate,
          notes: paymentDetails?.notes || `Admin manual layaway plan created (${layawayTerms?.frequency || 'Monthly'})`,
          installments: {
            create: (layawayTerms?.installments || []).map((inst: any, idx: number) => ({
              installmentNumber: inst.installmentNumber || idx + 1,
              dueDate: new Date(inst.dueDate),
              amountDue: inst.amountDue,
              amountPaid: inst.status === 'PAID' ? inst.amountDue : (inst.amountPaid || 0),
              status: inst.status || 'PENDING',
              paidAt: inst.status === 'PAID' ? new Date() : null,
              receiptNumber: `INST-${seq}-${idx + 1}`,
            })),
          },
        },
      });
    }

    // 6. Record Payment if Downpayment or Full Cash paid
    const amountPaid = paymentDetails?.amountPaid ?? (transactionType === 'LAYAWAY' ? pricing.downPaymentAmount : pricing.totalAmount);
    if (amountPaid > 0) {
      await prisma.payment.create({
        data: {
          paymentNumber,
          invoiceNumber: orderNumber,
          userId: user.id,
          orderId: order.id,
          contractId: layawayContract?.id || null,
          amount: amountPaid,
          paymentMethod: paymentDetails?.paymentMethod || 'CASH',
          paymentType: transactionType === 'LAYAWAY' ? 'DOWN_PAYMENT' : 'FULL_ORDER',
          status: 'SUCCESS',
          referenceCode: paymentDetails?.referenceCode || `REF-${seq}`,
          notes: paymentDetails?.notes || 'Manual receipt counter payment received',
        },
      });
    }

    // 7. Activity Log
    await prisma.activityLog.create({
      data: {
        action: 'MANUAL_RECEIPT_GENERATED',
        details: `Generated receipt ${orderNumber} for client ${client.name} (Total: ₱${pricing.totalAmount.toLocaleString()})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Receipt and order successfully recorded!',
      orderId: order.id,
      orderNumber,
      contractId: layawayContract?.id || null,
      userId: user.id,
    });
  } catch (error) {
    console.error('Error generating manual receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate manual receipt: ' + String(error) },
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
        { success: false, error: 'Receipt ID(s) required' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').filter(Boolean);

    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.layawayContract.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({
      success: true,
      message: `${ids.length} receipt(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting receipt(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete receipt(s)' },
      { status: 500 }
    );
  }
}
