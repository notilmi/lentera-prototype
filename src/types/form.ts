import type {
  DepositRolloverMode,
  GiroApplicantCategory,
  GiroFacilityOption,
} from './account.ts';

export interface SavingsApplicationPayload {
  fullName: string;
  nik: string;
  phone: string;
  email: string;
  initialDeposit: number;
}

export interface DepositApplicationPayload {
  holderName: string;
  sourceAccount: string;
  principalAmount: number;
  tenorMonths: number;
  rolloverMode: DepositRolloverMode;
}

export interface GiroApplicationPayload {
  category: GiroApplicantCategory;
  entityName: string;
  npwp: string;
  businessSector: string;
  initialDeposit: number;
  facility: GiroFacilityOption;
}

export interface DepositCalculationResult {
  principal: number;
  tenorMonths: number;
  ratePa: number;
  grossInterest: number;
  taxAmount: number;
  netInterest: number;
  maturityTotal: number;
}
