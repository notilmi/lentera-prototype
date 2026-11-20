export type ProductKind = 'tabungan' | 'deposito' | 'giro';

export type DepositRolloverMode = 'ARO_POKOK' | 'ARO_POKOK_BUNGA' | 'NON_ARO';

export type GiroApplicantCategory = 'perorangan' | 'badan_usaha';

export type GiroFacilityOption = 'kombinasi' | 'cek' | 'bg' | 'digital';

export interface BaseAccount {
  id: string;
  productKind: ProductKind;
  accountNumber: string;
  holderName: string;
  balance: number;
  openedAt: string;
  status: 'AKTIF';
}

export interface SavingsAccount extends BaseAccount {
  productKind: 'tabungan';
  nik: string;
  phone: string;
  email: string;
  cardNumber: string;
  cardExpiry: string;
  interestRatePa: number;
}

export interface DepositAccount extends BaseAccount {
  productKind: 'deposito';
  certificateNumber: string;
  sourceLabel: string;
  tenorMonths: number;
  interestRatePa: number;
  rolloverMode: DepositRolloverMode;
  maturityDate: string;
  estimatedNetInterest: number;
  estimatedMaturityTotal: number;
}

export interface GiroAccount extends BaseAccount {
  productKind: 'giro';
  category: GiroApplicantCategory;
  npwp: string;
  businessSector: string;
  facility: GiroFacilityOption;
  monthlyAdminFee: number;
  giroRatePa: number;
}

export type BankAccount = SavingsAccount | DepositAccount | GiroAccount;

export interface PortfolioSummary {
  totalBalance: number;
  savingsTotal: number;
  depositTotal: number;
  giroTotal: number;
  accountCount: number;
}
