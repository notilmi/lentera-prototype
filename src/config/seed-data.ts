import { PRODUCT_RULES } from './product-rules.ts';
import type { BankAccount } from '../types/account.ts';
import type { LedgerTransaction } from '../types/transaction.ts';

export const MOCK_CUSTOMER = {
  fullName: 'Raka Pratama',
  cif: 'CIF-2026-008412',
  nik: '1607011205020001',
  phone: '0812-7890-4321',
  email: 'raka.pratama@lentera.id',
  tier: 'Nasabah Terverifikasi',
} as const;

export function createSeedAccounts(): BankAccount[] {
  return [
    {
      id: 'acc-seed-tabungan-01',
      productKind: 'tabungan',
      accountNumber: '8820-4109-8821',
      holderName: MOCK_CUSTOMER.fullName,
      balance: 12_500_000,
      openedAt: '12 Nov 2026',
      status: 'AKTIF',
      nik: MOCK_CUSTOMER.nik,
      phone: MOCK_CUSTOMER.phone,
      email: MOCK_CUSTOMER.email,
      cardNumber: '8820 4109 8821 9102',
      cardExpiry: '11/31',
      interestRatePa: PRODUCT_RULES.savings.interestRatePa,
    },
  ];
}

export function createSeedLedger(): LedgerTransaction[] {
  return [
    {
      id: 'tx-seed-03',
      timestamp: '20 Nov, 09:15',
      productKind: 'tabungan',
      accountNumber: '8820-4109-8821',
      description: 'Bunga Harian Tabungan Lentera (3.50% p.a.)',
      amount: 18_450,
      type: 'CREDIT',
    },
    {
      id: 'tx-seed-02',
      timestamp: '16 Nov, 14:30',
      productKind: 'tabungan',
      accountNumber: '8820-4109-8821',
      description: 'Top Up Saldo Masuk — Transfer Antar Bank',
      amount: 7_500_000,
      type: 'CREDIT',
    },
    {
      id: 'tx-seed-01',
      timestamp: '12 Nov, 10:05',
      productKind: 'tabungan',
      accountNumber: '8820-4109-8821',
      description: 'Setoran Awal Pembukaan Tabungan Lentera',
      amount: 4_981_550,
      type: 'CREDIT',
    },
  ];
}
