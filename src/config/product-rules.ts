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

export const LOAN_RULES = {
  konsumtif: {
    productName: 'Kredit Konsumtif Lentera',
    segmentLabel: 'Pengguna Umum (Individu)',
    contractPrefix: 'KR-KSM',
    minAmount: 5_000_000,
    maxAmount: 200_000_000,
    monthlyRatePercent: 0.88,
    provisionPercent: 1.0,
    maxDsrPercent: 40,
    tenors: [6, 12, 24, 36, 48, 60] as const,
    requirements: ['KTP & NIK Terverifikasi', 'Penghasilan Tetap / Slip Gaji', 'Rasio Cicilan ≤ 40% Penghasilan'],
  },
  umkm: {
    productName: 'Kredit Produktif / UMKM',
    segmentLabel: 'Pelaku Usaha (UMKM)',
    contractPrefix: 'KR-UMK',
    minAmount: 10_000_000,
    maxAmount: 500_000_000,
    monthlyRatePercent: 0.75,
    provisionPercent: 0.75,
    maxDsrPercent: 25,
    minBusinessYears: 1,
    tenors: [12, 24, 36, 48, 60] as const,
    requirements: ['NIB / Surat Keterangan Usaha', 'Usaha Berjalan Min. 1 Tahun', 'Rasio Cicilan ≤ 25% Omzet/Bulan'],
  },
} as const;

export const TRANSACTION_RULES = {
  transferBanks: [
    { code: 'LENTERA', name: 'Sesama LENTERA Bank', fee: 0 },
    { code: 'BCA', name: 'Bank Central Asia (BCA)', fee: 2_500 },
    { code: 'MANDIRI', name: 'Bank Mandiri', fee: 2_500 },
    { code: 'BNI', name: 'Bank Negara Indonesia (BNI)', fee: 2_500 },
    { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)', fee: 2_500 },
  ],
  qrisMerchants: [
    { id: 'kopi-lentera', name: 'Kopi Lentera Nusantara', city: 'Palembang', defaultAmount: 35_000 },
    { id: 'kantin-polsri', name: 'Kantin Kampus Polsri', city: 'Palembang', defaultAmount: 22_000 },
    { id: 'mart-sejahtera', name: 'Lentera Mart 24 Jam', city: 'Palembang', defaultAmount: 85_000 },
  ],
  billCategories: [
    { id: 'pln', label: 'Listrik PLN Pascabayar', fee: 2_500, sampleAmount: 245_000 },
    { id: 'pdam', label: 'Air PDAM Tirta Musi', fee: 2_500, sampleAmount: 118_000 },
    { id: 'internet', label: 'Internet & TV Kabel', fee: 2_500, sampleAmount: 325_000 },
    { id: 'bpjs', label: 'BPJS Kesehatan', fee: 2_500, sampleAmount: 150_000 },
    { id: 'pulsa', label: 'Pulsa & Paket Data', fee: 1_500, sampleAmount: 100_000 },
  ],
  ewallets: [
    { id: 'gopay', name: 'GoPay', fee: 1_000 },
    { id: 'ovo', name: 'OVO', fee: 1_000 },
    { id: 'dana', name: 'DANA', fee: 1_000 },
    { id: 'shopeepay', name: 'ShopeePay', fee: 1_000 },
  ],
  quickAmounts: [50_000, 100_000, 250_000, 500_000] as const,
} as const;
