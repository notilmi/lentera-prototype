import { PRODUCT_RULES } from '../config/product-rules.ts';
import { createSeedAccounts } from '../config/seed-data.ts';
import type {
  BankAccount,
  DepositAccount,
  GiroAccount,
  PortfolioSummary,
  SavingsAccount,
} from '../types/account.ts';
import type {
  DepositApplicationPayload,
  GiroApplicationPayload,
  SavingsApplicationPayload,
} from '../types/form.ts';
import { calculateDepositYield } from './calculator.service.ts';
import { addMonthsToDate, formatDateID } from './format.service.ts';
import { loadFromSession, saveToSession } from './storage.service.ts';

const ACCOUNTS_STORAGE_KEY = 'lentera_mbanking_accounts_v2';

type AccountsListener = (accounts: readonly BankAccount[], summary: PortfolioSummary) => void;

function randomDigits(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

function generateAccountNumber(prefix: string): string {
  return `${prefix}-${randomDigits(4)}-${randomDigits(4)}`;
}

function generateVirtualCardNumber(): string {
  return `8820 ${randomDigits(4)} ${randomDigits(4)} ${randomDigits(4)}`;
}

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  return `${PRODUCT_RULES.deposit.certificatePrefix}-${year}-${randomDigits(6)}`;
}

/**
 * Tanggung jawab tunggal: Mengelola state rekening aktif (Tabungan, Deposito, Giro),
 * pre-seeded mock customer, serta ringkasan saldo portofolio.
 */
class AccountService {
  private accounts: BankAccount[];
  private listeners: Set<AccountsListener> = new Set();

  constructor() {
    const stored = loadFromSession<BankAccount[] | null>(ACCOUNTS_STORAGE_KEY, null);
    if (stored && stored.length > 0) {
      this.accounts = stored;
    } else {
      this.accounts = createSeedAccounts();
      saveToSession(ACCOUNTS_STORAGE_KEY, this.accounts);
    }
  }

  public getAccounts(): readonly BankAccount[] {
    return this.accounts;
  }

  public getAccountById(id: string): BankAccount | undefined {
    return this.accounts.find((acc) => acc.id === id);
  }

  public getSummary(): PortfolioSummary {
    let savingsTotal = 0;
    let depositTotal = 0;
    let giroTotal = 0;

    for (const acc of this.accounts) {
      if (acc.productKind === 'tabungan') savingsTotal += acc.balance;
      else if (acc.productKind === 'deposito') depositTotal += acc.balance;
      else if (acc.productKind === 'giro') giroTotal += acc.balance;
    }

    return {
      totalBalance: savingsTotal + depositTotal + giroTotal,
      savingsTotal,
      depositTotal,
      giroTotal,
      accountCount: this.accounts.length,
    };
  }

  public subscribe(listener: AccountsListener): () => void {
    this.listeners.add(listener);
    listener(this.accounts, this.getSummary());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public createSavingsAccount(payload: SavingsApplicationPayload): SavingsAccount {
    const now = new Date();
    const expiryYear = (now.getFullYear() + 5).toString().slice(-2);
    const expiryMonth = String(now.getMonth() + 1).padStart(2, '0');

    const account: SavingsAccount = {
      id: `acc-${Date.now()}-${randomDigits(3)}`,
      productKind: 'tabungan',
      accountNumber: generateAccountNumber(PRODUCT_RULES.savings.accountPrefix),
      holderName: payload.fullName.trim(),
      balance: payload.initialDeposit,
      openedAt: formatDateID(now),
      status: 'AKTIF',
      nik: payload.nik.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      cardNumber: generateVirtualCardNumber(),
      cardExpiry: `${expiryMonth}/${expiryYear}`,
      interestRatePa: PRODUCT_RULES.savings.interestRatePa,
    };

    this.commitAccount(account);
    return account;
  }

  public createDepositAccount(payload: DepositApplicationPayload): DepositAccount {
    const now = new Date();
    const calc = calculateDepositYield(payload.principalAmount, payload.tenorMonths);
    const maturityDate = addMonthsToDate(now, payload.tenorMonths);

    const account: DepositAccount = {
      id: `dep-${Date.now()}-${randomDigits(3)}`,
      productKind: 'deposito',
      accountNumber: generateAccountNumber(PRODUCT_RULES.deposit.accountPrefix),
      certificateNumber: generateCertificateNumber(),
      holderName: payload.holderName.trim(),
      balance: payload.principalAmount,
      openedAt: formatDateID(now),
      status: 'AKTIF',
      sourceLabel:
        payload.sourceAccount === 'auto'
          ? 'Tabungan Lentera (Terhubung)'
          : 'Transfer Bank Lain (Simulasi)',
      tenorMonths: payload.tenorMonths,
      interestRatePa: calc.ratePa,
      rolloverMode: payload.rolloverMode,
      maturityDate: formatDateID(maturityDate),
      estimatedNetInterest: calc.netInterest,
      estimatedMaturityTotal: calc.maturityTotal,
    };

    this.commitAccount(account);
    return account;
  }

  public createGiroAccount(payload: GiroApplicationPayload): GiroAccount {
    const now = new Date();

    const account: GiroAccount = {
      id: `gir-${Date.now()}-${randomDigits(3)}`,
      productKind: 'giro',
      accountNumber: generateAccountNumber(PRODUCT_RULES.giro.accountPrefix),
      holderName: payload.entityName.trim(),
      balance: payload.initialDeposit,
      openedAt: formatDateID(now),
      status: 'AKTIF',
      category: payload.category,
      npwp: payload.npwp.trim(),
      businessSector: payload.businessSector.trim(),
      facility: payload.facility,
      monthlyAdminFee: PRODUCT_RULES.giro.monthlyAdminFee,
      giroRatePa: PRODUCT_RULES.giro.giroRatePa,
    };

    this.commitAccount(account);
    return account;
  }

  public resetToSeed(): void {
    this.accounts = createSeedAccounts();
    saveToSession(ACCOUNTS_STORAGE_KEY, this.accounts);
    this.notify();
  }

  private commitAccount(account: BankAccount): void {
    this.accounts = [account, ...this.accounts];
    saveToSession(ACCOUNTS_STORAGE_KEY, this.accounts);
    this.notify();
  }

  private notify(): void {
    const summary = this.getSummary();
    for (const listener of this.listeners) {
      listener(this.accounts, summary);
    }
  }
}

export const accountService = new AccountService();
