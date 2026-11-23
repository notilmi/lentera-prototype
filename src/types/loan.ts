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

export interface LoanApplicationPayload {
  kind: LoanKind;
  principal: number;
  tenorMonths: number;
  purpose: string;
  disbursementAccountId: string;
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
  disbursementAccountNumber: string;
  openedAt: string;
  status: 'AKTIF' | 'LUNAS';
}
