import type { ProductKind } from './account.ts';

export type LedgerEntryType = 'CREDIT' | 'DEBIT';

export type LedgerCategory = ProductKind | 'kredit' | 'transaksi';

export interface LedgerTransaction {
  id: string;
  timestamp: string;
  productKind: LedgerCategory;
  accountNumber: string;
  description: string;
  amount: number;
  type: LedgerEntryType;
}
