import { LOAN_RULES } from '../config/product-rules.ts';
import type { ActiveLoan, LoanApplicationPayload, LoanSimulationResult } from '../types/loan.ts';
import { accountService } from './account.service.ts';
import { calculateLoanInstallment } from './calculator.service.ts';
import { formatDateID } from './format.service.ts';
import { ledgerService } from './ledger.service.ts';
import { loadFromSession, saveToSession } from './storage.service.ts';

const LOANS_STORAGE_KEY = 'lentera_mbanking_loans_v1';

function randomDigits(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

/**
 * Tanggung jawab tunggal: Mengelola portofolio kredit nasabah (pengajuan,
 * pencairan dana ke rekening Simpanan, dan pembayaran angsuran bulanan).
 */
class LoanService {
  private loans: ActiveLoan[];

  constructor() {
    this.loans = loadFromSession<ActiveLoan[]>(LOANS_STORAGE_KEY, []);
  }

  public getLoans(): readonly ActiveLoan[] {
    return this.loans;
  }

  public applyLoan(
    payload: LoanApplicationPayload
  ): { ok: true; loan: ActiveLoan; simulation: LoanSimulationResult } | { ok: false; error: string } {
    const rule = LOAN_RULES[payload.kind];
    if (payload.principal < rule.minAmount || payload.principal > rule.maxAmount) {
      return {
        ok: false,
        error: `Plafon ${rule.productName} harus antara Rp ${rule.minAmount.toLocaleString('id-ID')} dan Rp ${rule.maxAmount.toLocaleString('id-ID')}.`,
      };
    }

    const simulation = calculateLoanInstallment(payload.kind, payload.principal, payload.tenorMonths);
    const creditResult = accountService.creditAccount(
      payload.disbursementAccountId,
      simulation.netDisbursement
    );

    if (!creditResult.ok) {
      return { ok: false, error: creditResult.error };
    }

    const contractNumber = `${rule.contractPrefix}-${new Date().getFullYear()}-${randomDigits(5)}`;
    const loan: ActiveLoan = {
      id: `loan-${Date.now()}-${randomDigits(3)}`,
      contractNumber,
      kind: payload.kind,
      productName: rule.productName,
      principal: payload.principal,
      tenorMonths: payload.tenorMonths,
      monthlyRatePercent: rule.monthlyRatePercent,
      monthlyInstallment: simulation.monthlyInstallment,
      paidInstallments: 0,
      remainingBalance: simulation.totalRepayment,
      purpose: payload.purpose.trim() || 'Kebutuhan Pembiayaan',
      disbursementAccountNumber: creditResult.account.accountNumber,
      openedAt: formatDateID(new Date()),
      status: 'AKTIF',
    };

    this.loans = [loan, ...this.loans];
    saveToSession(LOANS_STORAGE_KEY, this.loans);

    ledgerService.recordEntry({
      productKind: 'kredit',
      accountNumber: creditResult.account.accountNumber,
      description: `Pencairan ${rule.productName} (${contractNumber})`,
      amount: simulation.netDisbursement,
      type: 'CREDIT',
    });

    return { ok: true, loan, simulation };
  }

  public payInstallment(
    loanId: string,
    sourceAccountId: string
  ): { ok: true; loan: ActiveLoan; paidAmount: number; sourceAccountNumber: string } | { ok: false; error: string } {
    const loan = this.loans.find((item) => item.id === loanId);
    if (!loan) {
      return { ok: false, error: 'Data pinjaman tidak ditemukan.' };
    }
    if (loan.status === 'LUNAS' || loan.paidInstallments >= loan.tenorMonths) {
      return { ok: false, error: 'Pinjaman ini sudah lunas.' };
    }

    const debitResult = accountService.debitAccount(sourceAccountId, loan.monthlyInstallment);
    if (!debitResult.ok) {
      return { ok: false, error: debitResult.error };
    }

    const nextPaidCount = loan.paidInstallments + 1;
    const isPaidOff = nextPaidCount >= loan.tenorMonths;
    const updatedLoan: ActiveLoan = {
      ...loan,
      paidInstallments: nextPaidCount,
      remainingBalance: isPaidOff ? 0 : Math.max(0, loan.remainingBalance - loan.monthlyInstallment),
      status: isPaidOff ? 'LUNAS' : 'AKTIF',
    };

    this.loans = this.loans.map((item) => (item.id === loanId ? updatedLoan : item));
    saveToSession(LOANS_STORAGE_KEY, this.loans);

    ledgerService.recordEntry({
      productKind: 'kredit',
      accountNumber: debitResult.account.accountNumber,
      description: `Angsuran ke-${nextPaidCount}/${loan.tenorMonths} ${loan.productName}`,
      amount: loan.monthlyInstallment,
      type: 'DEBIT',
    });

    return {
      ok: true,
      loan: updatedLoan,
      paidAmount: loan.monthlyInstallment,
      sourceAccountNumber: debitResult.account.accountNumber,
    };
  }

  public reset(): void {
    this.loans = [];
    saveToSession(LOANS_STORAGE_KEY, this.loans);
  }
}

export const loanService = new LoanService();
