import { PRODUCT_RULES, getDepositRateByTenor } from '../config/product-rules.ts';
import type { DepositCalculationResult } from '../types/form.ts';

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
