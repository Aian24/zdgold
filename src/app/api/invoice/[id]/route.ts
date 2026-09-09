import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Check if ID matches an Order
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        user: true,
        orderItems: {
          include: { product: true },
        },
        layawayContract: {
          include: {
            installments: {
              orderBy: { installmentNumber: 'asc' },
            },
            payments: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (order) {
      const isLayaway = order.orderType === 'LAYAWAY' || !!order.layawayContract;
      const contract = order.layawayContract;

      const items = (order.orderItems || []).map((item) => ({
        id: item.id,
        name: item.product?.name || 'Fine Gold Jewelry',
        karat: item.karat || item.product?.karat || '18K',
        weightGrams: item.weightGrams || item.product?.weightGrams || 0,
        craftFee: item.craftFee || 0,
        quantity: item.quantity || 1,
        price: item.unitPrice || (item.totalPrice / (item.quantity || 1)),
        totalPrice: item.totalPrice,
      }));

      // If no order items found, fallback to placeholder item with order totals
      if (items.length === 0) {
        items.push({
          id: 'item-1',
          name: 'Custom Fine Gold Jewelry',
          karat: '18K',
          weightGrams: order.totalGoldWeightGrams || 0,
          craftFee: order.craftFeeTotal || 0,
          quantity: 1,
          price: order.totalAmount,
          totalPrice: order.totalAmount,
        });
      }

      const downPaymentAmount = isLayaway
        ? contract?.downPaymentAmount || order.payments.find((p) => p.paymentType === 'DOWN_PAYMENT')?.amount || 0
        : 0;

      const remainingBalance = isLayaway
        ? contract?.remainingBalance ?? Math.max(0, order.totalAmount - downPaymentAmount)
        : 0;

      const installments = isLayaway && contract?.installments
        ? contract.installments.map((inst) => ({
            id: inst.id,
            installmentNumber: inst.installmentNumber,
            dueDate: inst.dueDate,
            amountDue: inst.amountDue,
            amountPaid: inst.amountPaid,
            status: inst.status,
            paidAt: inst.paidAt,
            receiptNumber: inst.receiptNumber,
          }))
        : [];

      let frequency = 'MONTHLY';
      if (contract?.notes?.toLowerCase().includes('twice')) frequency = 'TWICE_MONTHLY';
      else if (contract?.notes?.toLowerCase().includes('weekly')) frequency = 'WEEKLY';

      const paymentMethod = order.payments[0]?.paymentMethod || 'CASH';

      return NextResponse.json({
        success: true,
        invoice: {
          id: order.id,
          receiptNumber: order.orderNumber,
          orderNumber: order.orderNumber,
          contractNumber: contract?.contractNumber || null,
          transactionType: isLayaway ? 'LAYAWAY' : 'CASH',
          issueDate: order.createdAt,
          client: {
            name: order.user?.name || 'Walk-in Customer',
            phone: order.user?.phone || '',
            email: order.user?.email || '',
            address: order.shippingAddress || order.user?.address || 'Store Pickup / Counter Release',
          },
          paymentMethod,
          items,
          pricing: {
            subtotal: order.subtotal || order.totalAmount,
            tax: order.tax || 0,
            craftFeeTotal: order.craftFeeTotal || 0,
            totalGoldWeightGrams: order.totalGoldWeightGrams || 0,
            totalAmount: order.totalAmount,
            downPaymentAmount,
            remainingBalance,
          },
          layawayTerms: isLayaway
            ? {
                termMonths: contract?.termMonths || installments.length || 2,
                frequency,
                installments,
                status: contract?.status || (remainingBalance <= 0 ? 'COMPLETED' : 'ACTIVE'),
              }
            : null,
          status: order.status,
          courier: order.courier || 'Store Counter Handover',
        },
      });
    }

    // 2. Check if ID matches a LayawayContract directly
    const contract = await prisma.layawayContract.findFirst({
      where: {
        OR: [{ id }, { contractNumber: id }],
      },
      include: {
        user: true,
        order: {
          include: {
            orderItems: {
              include: { product: true },
            },
            payments: {
              orderBy: { createdAt: 'desc' },
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
    });

    if (contract) {
      const orderItems = contract.order?.orderItems || [];
      const items = orderItems.map((item) => ({
        id: item.id,
        name: item.product?.name || 'Fine Gold Jewelry Piece',
        karat: item.karat || item.product?.karat || '18K',
        weightGrams: item.weightGrams || item.product?.weightGrams || 0,
        craftFee: item.craftFee || 0,
        quantity: item.quantity || 1,
        price: item.unitPrice || (item.totalPrice / (item.quantity || 1)),
        totalPrice: item.totalPrice,
      }));

      if (items.length === 0) {
        items.push({
          id: 'item-1',
          name: 'Custom 0% Layaway Gold Jewelry',
          karat: '18K',
          weightGrams: contract.order?.totalGoldWeightGrams || 0,
          craftFee: 0,
          quantity: 1,
          price: contract.totalAmount,
          totalPrice: contract.totalAmount,
        });
      }

      let frequency = 'MONTHLY';
      if (contract.notes?.toLowerCase().includes('twice')) frequency = 'TWICE_MONTHLY';
      else if (contract.notes?.toLowerCase().includes('weekly')) frequency = 'WEEKLY';

      const paymentMethod = contract.payments[0]?.paymentMethod || contract.order?.payments[0]?.paymentMethod || 'CASH';

      return NextResponse.json({
        success: true,
        invoice: {
          id: contract.id,
          receiptNumber: contract.contractNumber,
          orderNumber: contract.order?.orderNumber || contract.contractNumber,
          contractNumber: contract.contractNumber,
          transactionType: 'LAYAWAY',
          issueDate: contract.startDate || contract.createdAt,
          client: {
            name: contract.user?.name || 'Client',
            phone: contract.user?.phone || '',
            email: contract.user?.email || '',
            address: contract.order?.shippingAddress || contract.user?.address || 'Store Vault Collection',
          },
          paymentMethod,
          items,
          pricing: {
            subtotal: contract.totalAmount,
            tax: 0,
            craftFeeTotal: 0,
            totalGoldWeightGrams: contract.order?.totalGoldWeightGrams || 0,
            totalAmount: contract.totalAmount,
            downPaymentAmount: contract.downPaymentAmount,
            remainingBalance: contract.remainingBalance,
          },
          layawayTerms: {
            termMonths: contract.termMonths,
            frequency,
            installments: contract.installments,
            status: contract.status,
          },
          status: contract.status,
          courier: 'Over-The-Counter Secured Release',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invoice record not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice data' },
      { status: 500 }
    );
  }
}
