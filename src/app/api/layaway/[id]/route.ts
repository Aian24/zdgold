import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await prisma.layawayContract.findFirst({
      where: {
        OR: [{ id }, { contractNumber: id }],
      },
      include: {
        user: true,
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
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Layaway contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error('Error fetching layaway contract details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { installmentId, amount, paymentMethod = 'CREDIT_CARD', notes } = body;

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    // Find contract
    const contract = await prisma.layawayContract.findFirst({
      where: {
        OR: [{ id }, { contractNumber: id }],
      },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Target installment
    let targetInstallment = installmentId
      ? contract.installments.find((inst) => inst.id === installmentId)
      : contract.installments.find((inst) => inst.status === 'PENDING' || inst.status === 'PARTIAL');

    if (!targetInstallment) {
      targetInstallment = contract.installments[contract.installments.length - 1];
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-2026-${randomSuffix}`;
    const paymentNumber = `PAY-2026-${randomSuffix}`;

    // Execute atomic transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceNumber: receiptNumber,
          userId: contract.userId,
          orderId: contract.orderId,
          contractId: contract.id,
          installmentId: targetInstallment?.id,
          amount: payAmount,
          paymentMethod,
          paymentType: 'INSTALLMENT',
          status: 'SUCCESS',
          referenceCode: `AUTH-INST-${Date.now()}`,
          notes: notes || `Installment #${targetInstallment?.installmentNumber} payment received.`,
        },
      });

      // 2. Update installment
      if (targetInstallment) {
        const newPaid = targetInstallment.amountPaid + payAmount;
        const isFullyPaid = newPaid >= targetInstallment.amountDue - 0.01;
        await tx.installment.update({
          where: { id: targetInstallment.id },
          data: {
            amountPaid: newPaid,
            status: isFullyPaid ? 'PAID' : 'PARTIAL',
            paidAt: isFullyPaid ? new Date() : undefined,
            receiptNumber: receiptNumber,
          },
        });
      }

      // 3. Update contract remaining balance and status
      const updatedRemaining = Math.max(0, Number((contract.remainingBalance - payAmount).toFixed(2)));
      const isCompleted = updatedRemaining <= 0.01;

      // Find next pending installment
      const nextPending = contract.installments.find(
        (inst) => inst.id !== targetInstallment?.id && inst.status === 'PENDING'
      );

      const updatedContract = await tx.layawayContract.update({
        where: { id: contract.id },
        data: {
          remainingBalance: updatedRemaining,
          status: isCompleted ? 'COMPLETED' : contract.status,
          nextDueDate: nextPending ? nextPending.dueDate : null,
        },
      });

      // 4. If contract completed, update order status to ready for dispatch
      if (isCompleted) {
        await tx.order.update({
          where: { id: contract.orderId },
          data: {
            status: 'PROCESSING',
          },
        });
      }

      return { payment, contract: updatedContract, receiptNumber, isCompleted };
    });

    return NextResponse.json({
      success: true,
      message: transactionResult.isCompleted
        ? 'Congratulations! Layaway contract is now 100% paid and gold is cleared for delivery.'
        : `Payment of ₱${payAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} recorded successfully!`,
      data: transactionResult,
    });
  } catch (error) {
    console.error('Error processing installment payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process installment payment' },
      { status: 500 }
    );
  }
}
