import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateLayawayPlan } from '@/lib/layaway';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderType, // 'CASH' | 'LAYAWAY'
      userId,
      items,
      shippingAddress,
      city,
      postalCode,
      paymentMethod,
      downPaymentPercent = 20,
      termMonths = 6,
      customerInfo,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shopping cart is empty' },
        { status: 400 }
      );
    }

    // Resolve or find User
    let activeUserId = userId;
    if (!activeUserId) {
      // Find or create customer
      const existingUser = await prisma.user.findFirst({
        where: { email: customerInfo?.email || 'guest@zdgold.ph' },
      });

      if (existingUser) {
        activeUserId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: customerInfo?.email || `customer-${Date.now()}@zdgold.ph`,
            name: customerInfo?.name || 'Valued Customer',
            phone: customerInfo?.phone || null,
            address: shippingAddress || null,
            city: city || null,
            zipCode: postalCode || null,
            role: 'CUSTOMER',
          },
        });
        activeUserId = newUser.id;
      }
    }

    // Calculate totals
    let totalGoldWeightGrams = 0;
    let craftFeeTotal = 0;
    let subtotal = 0;

    for (const item of items) {
      const qty = item.quantity || 1;
      totalGoldWeightGrams += (item.product?.weightGrams || item.weightGrams || 0) * qty;
      craftFeeTotal += (item.product?.craftFee || item.craftFee || 0) * qty;
      subtotal += (item.unitPrice || item.totalPrice || item.product?.basePrice || 0) * (item.quantity ? 1 : qty);
    }

    const totalAmount = Number(subtotal.toFixed(2));
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `DG-2026-${randomSuffix}`;
    const invoiceNumber = `INV-2026-${randomSuffix}`;

    // Get current 24k spot price for price-locking record
    const spotRate = await prisma.goldRate.findUnique({
      where: { karat: '24K' },
    });
    const lockedGoldSpotRate = spotRate?.pricePerGram || 86.40;

    // Database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: activeUserId,
          orderType: orderType === 'LAYAWAY' ? 'LAYAWAY' : 'CASH',
          status: orderType === 'LAYAWAY' ? 'PROCESSING' : 'CONFIRMED',
          totalGoldWeightGrams: Number(totalGoldWeightGrams.toFixed(2)),
          subtotal: totalAmount,
          craftFeeTotal: Number(craftFeeTotal.toFixed(2)),
          tax: 0,
          totalAmount,
          shippingAddress: shippingAddress || 'Standard Vault Pickup',
          city: city || 'New York',
          postalCode: postalCode || '10001',
          courier: 'ZD Gold Insured Vault Courier',
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.product?.id || item.productId,
              quantity: item.quantity || 1,
              lockedGoldPricePerGram: item.lockedPricePerGram || 86.40,
              karat: item.product?.karat || item.karat || '24K',
              weightGrams: item.product?.weightGrams || item.weightGrams || 0,
              craftFee: item.product?.craftFee || item.craftFee || 0,
              unitPrice: item.unitPrice || item.product?.basePrice || 0,
              totalPrice: item.totalPrice || (item.unitPrice * item.quantity),
            })),
          },
        },
      });

      // 2. Decrement product stock (clamped to 0)
      for (const item of items) {
        const prodId = item.product?.id || item.productId;
        if (prodId) {
          const currentProd = await tx.product.findUnique({ where: { id: prodId } });
          if (currentProd) {
            const newStock = Math.max(0, currentProd.stockQuantity - (item.quantity || 1));
            await tx.product.update({
              where: { id: prodId },
              data: {
                stockQuantity: newStock,
              },
            });
          }
        }
      }

      // 3. Handle Cash vs Layaway
      if (orderType === 'CASH') {
        const paymentNumber = `PAY-2026-${randomSuffix}`;
        const payment = await tx.payment.create({
          data: {
            paymentNumber,
            invoiceNumber,
            userId: activeUserId,
            orderId: order.id,
            amount: totalAmount,
            paymentMethod: paymentMethod || 'CREDIT_CARD',
            paymentType: 'FULL_ORDER',
            status: 'SUCCESS',
            referenceCode: `AUTH-CASH-${Date.now()}`,
            notes: 'One-time cash payment completed in full.',
          },
        });

        return { order, payment, type: 'CASH' };
      } else {
        // Layaway Contract Flow
        const plan = calculateLayawayPlan(totalAmount, downPaymentPercent, termMonths);
        const contractNumber = `LAY-2026-${randomSuffix}`;

        const layawayContract = await tx.layawayContract.create({
          data: {
            contractNumber,
            orderId: order.id,
            userId: activeUserId,
            totalAmount: plan.totalPayable,
            downPaymentAmount: plan.downPaymentAmount,
            downPaymentPercent: plan.downPaymentPercent,
            remainingBalance: plan.remainingBalance,
            termMonths: plan.termMonths,
            monthlyInstallment: plan.monthlyInstallment,
            lockedGoldSpotRate,
            status: 'ACTIVE',
            startDate: new Date(),
            dueDate: plan.dueDate,
            nextDueDate: plan.monthlySchedule[0]?.dueDate,
            notes: `Gold spot price locked at ₱${lockedGoldSpotRate}/g. Down payment of ${plan.downPaymentPercent}% received.`,
          },
        });

        // Create initial Down Payment record
        const paymentNumber = `PAY-2026-${randomSuffix}`;
        const downPayment = await tx.payment.create({
          data: {
            paymentNumber,
            invoiceNumber,
            userId: activeUserId,
            orderId: order.id,
            contractId: layawayContract.id,
            amount: plan.downPaymentAmount,
            paymentMethod: paymentMethod || 'CREDIT_CARD',
            paymentType: 'DOWN_PAYMENT',
            status: 'SUCCESS',
            referenceCode: `AUTH-LAY-DP-${Date.now()}`,
            notes: `Initial ${plan.downPaymentPercent}% down payment for Contract ${contractNumber}.`,
          },
        });

        // Create the monthly installment schedule entries
        for (const item of plan.monthlySchedule) {
          await tx.installment.create({
            data: {
              contractId: layawayContract.id,
              installmentNumber: item.installmentNumber,
              dueDate: item.dueDate,
              amountDue: item.amount,
              amountPaid: 0,
              status: 'PENDING',
            },
          });
        }

        return { order, contract: layawayContract, payment: downPayment, plan, type: 'LAYAWAY' };
      }
    });

    return NextResponse.json({
      success: true,
      message:
        orderType === 'LAYAWAY'
          ? 'Layaway contract initiated and gold price locked successfully!'
          : 'Order placed and paid successfully!',
      data: result,
    });
  } catch (error) {
    console.error('Checkout processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Checkout failed. Please check inputs.' },
      { status: 500 }
    );
  }
}
