export type LoanKind = 'konsumtif' | 'umkm';

export interface LoanSimulationResult {
  kind: LoanKind;
  principal: number;
  tenorMonths: number;
  monthlyRatePercent: number;
  monthlyPrincipal: number;
  monthlyInterest: number;
  monthlyInstallment: number;
  provisionFee: number;
  netDisbursement: number;
  totalRepayment: number;
}

export interface LoanEligibilityResult {
  eligible: boolean;
  dsrPercent: number;
  maxDsrPercent: number;
  maxAllowedInstallment: number;
  reason: string;
}

export interface LoanApplicationPayload {
  kind: LoanKind;
  principal: number;
  tenorMonths: number;
  purpose: string;
  disbursementAccountId: string;
  // Individu (Konsumtif)
  employmentStatus?: string;
  monthlyIncome?: number;
  // UMKM
  businessName?: string;
  businessSector?: string;
  businessYears?: number;
  monthlyRevenue?: number;
  nibNumber?: string;
}

export interface ActiveLoan {
  id: string;
  contractNumber: string;
  kind: LoanKind;
  productName: string;
  principal: number;
  tenorMonths: number;
  monthlyRatePercent: number;
  monthlyInstallment: number;
  paidInstallments: number;
  remainingBalance: number;
  purpose: string;
  applicantSummary: string;
  dsrPercent: number;
  disbursementAccountNumber: string;
  openedAt: string;
  status: 'AKTIF' | 'LUNAS';
}
