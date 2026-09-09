import { LayawayPlanOption } from './types';

export const ALLOWED_DOWNPAYMENT_PERCENTS = [20, 30, 50];
export const ALLOWED_LAYAWAY_TERMS = [3, 6, 9, 12]; // in months

/**
 * Calculates a layaway installment plan given a total purchase amount,
 * downpayment percentage (e.g., 20, 30, 50), and term in months (e.g., 3, 6, 9, 12).
 */
export function calculateLayawayPlan(
  totalAmount: number,
  downPaymentPercent: number = 20,
  termMonths: number = 6,
  startDate: Date = new Date()
): LayawayPlanOption {
  // Ensure valid downpayment percentage
  const validPercent = ALLOWED_DOWNPAYMENT_PERCENTS.includes(downPaymentPercent)
    ? downPaymentPercent
    : 20;

  // Ensure valid terms
  const validTerms = ALLOWED_LAYAWAY_TERMS.includes(termMonths)
    ? termMonths
    : 6;

  const downPaymentAmount = Number(((totalAmount * validPercent) / 100).toFixed(2));
  const remainingBalance = Number((totalAmount - downPaymentAmount).toFixed(2));
  const monthlyInstallment = Number((remainingBalance / validTerms).toFixed(2));

  // Calculate monthly installment dates
  const monthlySchedule = [];
  const finalDueDate = new Date(startDate);
  finalDueDate.setMonth(finalDueDate.getMonth() + validTerms);

  for (let i = 1; i <= validTerms; i++) {
    const installmentDue = new Date(startDate);
    installmentDue.setMonth(installmentDue.getMonth() + i);

    // Minor adjustment on final installment for penny rounding
    let amount = monthlyInstallment;
    if (i === validTerms) {
      const allocatedSoFar = monthlyInstallment * (validTerms - 1);
      amount = Number((remainingBalance - allocatedSoFar).toFixed(2));
    }

    monthlySchedule.push({
      installmentNumber: i,
      dueDate: installmentDue,
      amount,
    });
  }

  return {
    termMonths: validTerms,
    downPaymentPercent: validPercent,
    downPaymentAmount,
    remainingBalance,
    monthlyInstallment,
    totalPayable: totalAmount,
    dueDate: finalDueDate,
    monthlySchedule,
  };
}

/**
 * Check if an installment is overdue relative to today
 */
export function isInstallmentOverdue(dueDate: Date | string, status: string): boolean {
  if (status === 'PAID') return false;
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
}

/**
 * Computes the progress percentage of paid amount on a layaway contract
 */
export function calculateLayawayProgress(totalAmount: number, remainingBalance: number): number {
  if (totalAmount <= 0) return 100;
  const paid = totalAmount - remainingBalance;
  return Math.min(100, Math.max(0, Math.round((paid / totalAmount) * 100)));
}
