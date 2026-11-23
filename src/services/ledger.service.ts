import { createSeedLedger } from '../config/seed-data.ts';
import type { LedgerCategory, LedgerEntryType, LedgerTransaction } from '../types/transaction.ts';
import { formatDateTimeID } from './format.service.ts';
import { loadFromSession, saveToSession } from './storage.service.ts';

const LEDGER_STORAGE_KEY = 'lentera_mbanking_ledger_v2';

type LedgerListener = (entries: readonly LedgerTransaction[]) => void;

/**
 * Tanggung jawab tunggal: Mencatat dan menyiarkan riwayat mutasi transaksi simulasi.
 */
class LedgerService {
  private entries: LedgerTransaction[];
  private listeners: Set<LedgerListener> = new Set();

  constructor() {
    const stored = loadFromSession<LedgerTransaction[] | null>(LEDGER_STORAGE_KEY, null);
    if (stored && stored.length > 0) {
      this.entries = stored;
    } else {
      this.entries = createSeedLedger();
      saveToSession(LEDGER_STORAGE_KEY, this.entries);
    }
  }

  public getEntries(): readonly LedgerTransaction[] {
    return this.entries;
  }

  public getEntriesByAccountNumber(accountNumber: string): readonly LedgerTransaction[] {
    return this.entries.filter((entry) => entry.accountNumber === accountNumber);
  }

  public subscribe(listener: LedgerListener): () => void {
    this.listeners.add(listener);
    listener(this.entries);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public recordEntry(params: {
    productKind: LedgerCategory;
    accountNumber: string;
    description: string;
    amount: number;
    type?: LedgerEntryType;
  }): LedgerTransaction {
    const entry: LedgerTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      timestamp: formatDateTimeID(new Date()),
      productKind: params.productKind,
      accountNumber: params.accountNumber,
      description: params.description,
      amount: params.amount,
      type: params.type ?? 'CREDIT',
    };

    this.entries = [entry, ...this.entries];
    saveToSession(LEDGER_STORAGE_KEY, this.entries);
    this.notify();
    return entry;
  }

  public initializeForRegisteredUser(accountNumber: string, amount: number): void {
    const welcomeEntry: LedgerTransaction = {
      id: `tx-welcome-${Date.now()}`,
      timestamp: formatDateTimeID(new Date()),
      productKind: 'tabungan',
      accountNumber,
      description: 'Saldo Awal Pembukaan Akun Tabungan Lentera',
      amount,
      type: 'CREDIT',
    };
    this.entries = [welcomeEntry];
    saveToSession(LEDGER_STORAGE_KEY, this.entries);
    this.notify();
  }

  public resetToSeed(): void {
    this.entries = createSeedLedger();
    saveToSession(LEDGER_STORAGE_KEY, this.entries);
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.entries);
    }
  }
}

export const ledgerService = new LedgerService();
