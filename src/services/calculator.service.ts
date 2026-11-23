import { LOAN_RULES, PRODUCT_RULES, getDepositRateByTenor } from '../config/product-rules.ts';
import type { DepositCalculationResult } from '../types/form.ts';
import type { LoanKind, LoanSimulationResult } from '../types/loan.ts';

/**
 * Tanggung jawab tunggal: Menghitung proyeksi bunga kotor, pajak 20%, bunga bersih,
 * dan total dana jatuh tempo deposito.
 */
export function calculateDepositYield(
  principal: number,
  tenorMonths: number
): DepositCalculationResult {
  const safePrincipal = Math.max(0, Number.isFinite(principal) ? principal : 0);
  const ratePa = getDepositRateByTenor(tenorMonths);

  const grossInterest = (safePrincipal * (ratePa / 100) * tenorMonths) / 12;
  const taxAmount = grossInterest * PRODUCT_RULES.deposit.taxRate;
  const netInterest = grossInterest - taxAmount;
  const maturityTotal = safePrincipal + netInterest;

  return {
    principal: safePrincipal,
    tenorMonths,
    ratePa,
    grossInterest: Math.round(grossInterest),
    taxAmount: Math.round(taxAmount),
    netInterest: Math.round(netInterest),
    maturityTotal: Math.round(maturityTotal),
  };
}

/**
 * Menghitung simulasi angsuran kredit flat per bulan, biaya provisi,
 * serta total dana bersih yang dicairkan ke rekening nasabah.
 */
export function calculateLoanInstallment(
  kind: LoanKind,
  principal: number,
  tenorMonths: number
): LoanSimulationResult {
  const rule = LOAN_RULES[kind];
  const safePrincipal = Math.max(0, Number.isFinite(principal) ? principal : 0);
  const safeTenor = Math.max(1, tenorMonths);

  const monthlyPrincipal = Math.round(safePrincipal / safeTenor);
  const monthlyInterest = Math.round(safePrincipal * (rule.monthlyRatePercent / 100));
  const monthlyInstallment = monthlyPrincipal + monthlyInterest;
  const provisionFee = Math.round(safePrincipal * (rule.provisionPercent / 100));
  const netDisbursement = Math.max(0, safePrincipal - provisionFee);
  const totalRepayment = monthlyInstallment * safeTenor;

  return {
    kind,
    principal: safePrincipal,
    tenorMonths: safeTenor,
    monthlyRatePercent: rule.monthlyRatePercent,
    monthlyPrincipal,
    monthlyInterest,
    monthlyInstallment,
    provisionFee,
    netDisbursement,
    totalRepayment,
  };
}
