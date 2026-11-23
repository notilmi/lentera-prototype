import type { TransaksiMode } from '../types/navigation.ts';
import { accountService } from './account.service.ts';
import { formatDateTimeID } from './format.service.ts';
import { ledgerService } from './ledger.service.ts';

export interface DigitalTxPayload {
  mode: TransaksiMode;
  sourceAccountId: string;
  targetLabel: string;
  description: string;
  amount: number;
  fee: number;
}

export interface DigitalTxReceipt {
  refId: string;
  timestamp: string;
  sourceAccountNumber: string;
  targetLabel: string;
  amount: number;
  fee: number;
  totalDebit: number;
}

/**
 * Tanggung jawab tunggal: Mengeksekusi transaksi digital harian (Transfer, QRIS,
 * Tagihan, Top Up e-Wallet), memvalidasi & mendebit saldo, serta mencatat mutasi.
 */
class TransferService {
  public execute(
    payload: DigitalTxPayload
  ): { ok: true; receipt: DigitalTxReceipt } | { ok: false; error: string } {
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return { ok: false, error: 'Nominal transaksi harus lebih dari Rp 0.' };
    }
    const fee = Math.max(0, Math.round(payload.fee));
    const amount = Math.round(payload.amount);
    const totalDebit = amount + fee;

    const debitResult = accountService.debitAccount(payload.sourceAccountId, totalDebit);
    if (!debitResult.ok) {
      return { ok: false, error: debitResult.error };
    }

    const refId = `LNT-${Date.now().toString().slice(-8)}`;
    ledgerService.recordEntry({
      productKind: 'transaksi',
      accountNumber: debitResult.account.accountNumber,
      description: payload.description,
      amount: totalDebit,
      type: 'DEBIT',
    });

    return {
      ok: true,
      receipt: {
        refId,
        timestamp: formatDateTimeID(new Date()),
        sourceAccountNumber: debitResult.account.accountNumber,
        targetLabel: payload.targetLabel,
        amount,
        fee,
        totalDebit,
      },
    };
  }
}

export const transferService = new TransferService();
