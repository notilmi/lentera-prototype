import type { ProductKind } from './account.ts';

export type LedgerEntryType = 'CREDIT' | 'DEBIT';

export interface LedgerTransaction {
  id: string;
  timestamp: string;
  productKind: ProductKind;
  accountNumber: string;
  description: string;
  amount: number;
  type: LedgerEntryType;
}
