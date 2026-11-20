import type { DepositRolloverMode, GiroFacilityOption } from '../types/account.ts';

/**
 * Single source of truth untuk seluruh aturan produk simpanan LENTERA Bank.
 * Ubah angka di berkas ini untuk melakukan tweak suku bunga, setoran awal, atau biaya admin.
 */
export const PRODUCT_RULES = {
  savings: {
    productName: 'Tabungan Lentera',
    accountPrefix: '8820',
    interestRatePa: 3.5,
    minInitialDeposit: 50_000,
    minHoldBalance: 20_000,
    monthlyAdminFee: 0,
  },
  deposit: {
    productName: 'Deposito Lentera Maxima',
    accountPrefix: '8810',
    certificatePrefix: 'BD-LNT',
    minPlacement: 1_000_000,
    maxSliderPlacement: 100_000_000,
    taxRate: 0.2,
    tenors: [
      { months: 1, ratePa: 4.5, label: '1 Bulan' },
      { months: 3, ratePa: 5.0, label: '3 Bulan' },
      { months: 6, ratePa: 5.5, label: '6 Bulan' },
      { months: 12, ratePa: 6.0, label: '12 Bulan' },
    ],
  },
  giro: {
    productName: 'Giro Lentera Niaga',
    accountPrefix: '8830',
    minInitialDeposit: 1_000_000,
    monthlyAdminFee: 25_000,
    giroRatePa: 1.5,
  },
} as const;

export const ROLLOVER_LABELS: Record<DepositRolloverMode, string> = {
  ARO_POKOK: 'ARO Pokok (Bunga cair ke Tabungan)',
  ARO_POKOK_BUNGA: 'ARO Pokok + Bunga (Majemuk)',
  NON_ARO: 'Non-ARO (Cair penuh saat jatuh tempo)',
};

export const GIRO_FACILITY_LABELS: Record<GiroFacilityOption, string> = {
  kombinasi: 'Buku Cek (25 lbr) + Bilyet Giro (25 lbr)',
  cek: 'Buku Cek (25 lembar)',
  bg: 'Buku Bilyet Giro (25 lembar)',
  digital: 'Pemindahbukuan Digital (Tanpa Warkat)',
};

export function getDepositRateByTenor(tenorMonths: number): number {
  const match = PRODUCT_RULES.deposit.tenors.find((t) => t.months === tenorMonths);
  return match ? match.ratePa : PRODUCT_RULES.deposit.tenors[2].ratePa;
}
