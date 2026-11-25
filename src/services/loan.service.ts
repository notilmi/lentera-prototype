import { LOAN_RULES } from '../config/product-rules.ts';
import type {
  ActiveLoan,
  LoanApplicationPayload,
  LoanEligibilityResult,
  LoanSimulationResult,
} from '../types/loan.ts';
import { accountService } from './account.service.ts';
import { calculateLoanInstallment } from './calculator.service.ts';
import { formatDateID, formatIDR } from './format.service.ts';
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
 * Tanggung jawab tunggal: Mengelola portofolio kredit nasabah (evaluasi kelayakan DSR
 * Individu & UMKM, pengajuan, pencairan dana ke Simpanan, dan pembayaran angsuran).
 */
class LoanService {
  private loans: ActiveLoan[];

  constructor() {
    this.loans = loadFromSession<ActiveLoan[]>(LOANS_STORAGE_KEY, []);
  }

  public getLoans(): readonly ActiveLoan[] {
    return this.loans;
  }

  public getActiveMonthlyObligation(): number {
    return this.loans
      .filter((l) => l.status === 'AKTIF')
      .reduce((sum, l) => sum + l.monthlyInstallment, 0);
  }

  public evaluateEligibility(
    payload: Pick<
      LoanApplicationPayload,
      'kind' | 'monthlyIncome' | 'monthlyRevenue' | 'businessYears'
    >,
    newMonthlyInstallment: number
  ): LoanEligibilityResult {
    const rule = LOAN_RULES[payload.kind];
    const existingDebt = this.getActiveMonthlyObligation();
    const totalDebt = existingDebt + newMonthlyInstallment;

    if (payload.kind === 'umkm') {
      const years = payload.businessYears ?? 0;
      const revenue = Math.max(0, payload.monthlyRevenue ?? 0);
      const maxAllowed = Math.round(revenue * (rule.maxDsrPercent / 100));
      const dsrPercent = revenue > 0 ? Math.round((totalDebt / revenue) * 1000) / 10 : 100;

      if (years < LOAN_RULES.umkm.minBusinessYears) {
        return {
          eligible: false,
          dsrPercent,
          maxDsrPercent: rule.maxDsrPercent,
          maxAllowedInstallment: maxAllowed,
          reason: `Lama usaha minimal ${LOAN_RULES.umkm.minBusinessYears} tahun untuk pengajuan Kredit UMKM.`,
        };
      }
      if (revenue <= 0) {
        return {
          eligible: false,
          dsrPercent: 100,
          maxDsrPercent: rule.maxDsrPercent,
          maxAllowedInstallment: 0,
          reason: 'Masukkan omzet bulanan usaha yang valid untuk evaluasi kelayakan.',
        };
      }
      if (totalDebt > maxAllowed) {
        return {
          eligible: false,
          dsrPercent,
          maxDsrPercent: rule.maxDsrPercent,
          maxAllowedInstallment: maxAllowed,
          reason: `Total cicilan (${formatIDR(totalDebt)}/bln, DSR ${dsrPercent}%) melebihi batas aman ${rule.maxDsrPercent}% omzet (${formatIDR(maxAllowed)}/bln). Silakan kurangi plafon atau perpanjang tenor.`,
        };
      }

      return {
        eligible: true,
        dsrPercent,
        maxDsrPercent: rule.maxDsrPercent,
        maxAllowedInstallment: maxAllowed,
        reason: `Layak disetujui (DSR ${dsrPercent}% ≤ batas ${rule.maxDsrPercent}% omzet).`,
      };
    }

    // Individu (Konsumtif)
    const income = Math.max(0, payload.monthlyIncome ?? 0);
    const maxAllowed = Math.round(income * (rule.maxDsrPercent / 100));
    const dsrPercent = income > 0 ? Math.round((totalDebt / income) * 1000) / 10 : 100;

    if (income <= 0) {
      return {
        eligible: false,
        dsrPercent: 100,
        maxDsrPercent: rule.maxDsrPercent,
        maxAllowedInstallment: 0,
        reason: 'Masukkan penghasilan bersih bulanan yang valid untuk evaluasi kelayakan.',
      };
    }
    if (totalDebt > maxAllowed) {
      return {
        eligible: false,
        dsrPercent,
        maxDsrPercent: rule.maxDsrPercent,
        maxAllowedInstallment: maxAllowed,
        reason: `Total cicilan (${formatIDR(totalDebt)}/bln, DSR ${dsrPercent}%) melebihi batas aman ${rule.maxDsrPercent}% penghasilan (${formatIDR(maxAllowed)}/bln). Silakan kurangi plafon atau perpanjang tenor.`,
      };
    }

    return {
      eligible: true,
      dsrPercent,
      maxDsrPercent: rule.maxDsrPercent,
      maxAllowedInstallment: maxAllowed,
      reason: `Layak disetujui (DSR ${dsrPercent}% ≤ batas ${rule.maxDsrPercent}% penghasilan).`,
    };
  }

  public applyLoan(
    payload: LoanApplicationPayload
  ):
    | { ok: true; loan: ActiveLoan; simulation: LoanSimulationResult; eligibility: LoanEligibilityResult }
    | { ok: false; error: string; eligibility?: LoanEligibilityResult } {
    const rule = LOAN_RULES[payload.kind];
    if (payload.principal < rule.minAmount || payload.principal > rule.maxAmount) {
      return {
        ok: false,
        error: `Plafon ${rule.productName} harus antara ${formatIDR(rule.minAmount)} dan ${formatIDR(rule.maxAmount)}.`,
      };
    }

    const simulation = calculateLoanInstallment(payload.kind, payload.principal, payload.tenorMonths);
    const eligibility = this.evaluateEligibility(payload, simulation.monthlyInstallment);
    if (!eligibility.eligible) {
      return { ok: false, error: eligibility.reason, eligibility };
    }

    const creditResult = accountService.creditAccount(
      payload.disbursementAccountId,
      simulation.netDisbursement
    );

    if (!creditResult.ok) {
      return { ok: false, error: creditResult.error };
    }

    const applicantSummary =
      payload.kind === 'umkm'
        ? `${payload.businessName?.trim() || 'Usaha UMKM'} • ${payload.businessSector || 'UMKM'} (NIB: ${payload.nibNumber?.trim() || '-'})`
        : `${payload.employmentStatus || 'Individu'} • Penghasilan ${formatIDR(payload.monthlyIncome ?? 0)}/bln`;

    const contractNumber = `${rule.contractPrefix}-${new Date().getFullYear()}-${randomDigits(5)}`;
    const loan: ActiveLoan = {
      id: `loan-${Date.now()}-${randomDigits(3)}`,
      contractNumber,
      kind: payload.kind,
      productName: rule.productName,
      principal: payload.principal,
      tenorMonths: payload.tenorMonths,
      monthlyRatePercent: simulation.monthlyRatePercent,
      monthlyInstallment: simulation.monthlyInstallment,
      paidInstallments: 0,
      remainingBalance: simulation.totalRepayment,
      purpose: payload.purpose.trim() || 'Kebutuhan Pembiayaan',
      applicantSummary,
      dsrPercent: eligibility.dsrPercent,
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

    return { ok: true, loan, simulation, eligibility };
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
