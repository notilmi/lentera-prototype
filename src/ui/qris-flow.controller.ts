import { TRANSACTION_RULES } from '../config/product-rules.ts';
import { accountService } from '../services/account.service.ts';
import { formatIDR } from '../services/format.service.ts';
import { transferService, type DigitalTxReceipt } from '../services/transfer.service.ts';
import { renderLucideIcons } from './icons.ts';

type QrisStep = 'scan' | 'review' | 'pin' | 'success';

interface QrisMerchant {
  id: string;
  name: string;
  city: string;
  defaultAmount: number;
}

/**
 * Tanggung jawab tunggal: Mengelola pengalaman pembayaran QRIS 4-langkah
 * (1. Kamera Scanner, 2. Review Payment, 3. Keypad PIN 6-Digit, 4. Payment Successful).
 */
class QrisFlowController {
  private overlayEl: HTMLElement | null = null;
  private stream: MediaStream | null = null;
  private step: QrisStep = 'scan';
  private merchant: QrisMerchant = TRANSACTION_RULES.qrisMerchants[0];
  private amount: number = TRANSACTION_RULES.qrisMerchants[0].defaultAmount;
  private selectedAccountId = '';
  private pinValue = '';
  private pinError = '';
  private receipt: DigitalTxReceipt | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  public open(options?: { merchantId?: string; onComplete?: () => void }): void {
    this.close();

    const preset =
      TRANSACTION_RULES.qrisMerchants.find((m) => m.id === options?.merchantId) ??
      TRANSACTION_RULES.qrisMerchants[0];
    this.merchant = preset;
    this.amount = preset.defaultAmount;

    const accounts = accountService.getTransactableAccounts();
    this.selectedAccountId = accounts[0]?.id ?? '';
    this.pinValue = '';
    this.pinError = '';
    this.receipt = null;
    this.step = 'scan';
    this.onCompleteCallback = options?.onComplete ?? null;

    const overlay = document.createElement('div');
    overlay.className = 'qris-overlay';
    overlay.id = 'qris-flow-overlay';
    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        return;
      }
      if (this.step === 'pin') {
        if (/^\d$/.test(e.key)) {
          this.appendPinDigit(e.key);
        } else if (e.key === 'Backspace') {
          this.backspacePin();
        }
      }
    };
    window.addEventListener('keydown', this.keydownHandler);

    this.render();
  }

  public close(): void {
    this.stopCamera();
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  private async startCamera(): Promise<void> {
    const videoEl = document.getElementById('qris-camera-video') as HTMLVideoElement | null;
    const fallbackEl = document.getElementById('qris-camera-fallback');
    if (!videoEl || !navigator.mediaDevices?.getUserMedia) {
      if (fallbackEl) fallbackEl.classList.remove('hidden');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      if (this.step !== 'scan') {
        this.stopCamera();
        return;
      }
      videoEl.srcObject = this.stream;
      await videoEl.play();
      if (fallbackEl) fallbackEl.classList.add('hidden');
    } catch {
      if (fallbackEl) fallbackEl.classList.remove('hidden');
    }
  }

  private render(): void {
    if (!this.overlayEl) return;

    if (this.step !== 'scan') {
      this.stopCamera();
    }

    let bodyHtml = '';
    if (this.step === 'scan') bodyHtml = this.renderScanStep();
    else if (this.step === 'review') bodyHtml = this.renderReviewStep();
    else if (this.step === 'pin') bodyHtml = this.renderPinStep();
    else bodyHtml = this.renderSuccessStep();

    this.overlayEl.innerHTML = `<div class="qris-phone-shell">${bodyHtml}</div>`;
    this.bindStepEvents();
    renderLucideIcons();

    if (this.step === 'scan') {
      void this.startCamera();
    }
  }

  private renderScanStep(): string {
    return `
      <div class="qris-scan-screen">
        <video id="qris-camera-video" class="qris-video" autoplay playsinline muted></video>
        <div id="qris-camera-fallback" class="qris-camera-fallback">
          <div class="qris-mock-qr-card">
            <i data-lucide="qr-code" width="120" height="120"></i>
            <span>Preview QRIS Merchant</span>
          </div>
        </div>

        <div class="qris-scan-topbar">
          <button type="button" class="qris-circle-btn" id="qris-close-btn" aria-label="Tutup kamera">
            <i data-lucide="x" width="18" height="18"></i>
          </button>
          <span class="qris-top-badge">QRIS • LENTERA Pay</span>
          <button type="button" class="qris-circle-btn" id="qris-flash-btn" aria-label="Kilas cahaya">
            <i data-lucide="zap" width="18" height="18"></i>
          </button>
        </div>

        <div class="qris-reticle-stage" id="qris-reticle-tap">
          <div class="qris-reticle">
            <span class="qris-corner tl"></span>
            <span class="qris-corner tr"></span>
            <span class="qris-corner bl"></span>
            <span class="qris-corner br"></span>
            <span class="qris-scan-line"></span>
          </div>
          <span class="qris-scan-hint">Arahkan kamera ke kode QRIS atau tap area ini</span>
        </div>

        <div class="qris-scan-sheet">
          <div class="qris-sheet-label">Pilih Merchant Demo untuk Simulasi Scan:</div>
          <div class="filter-chip-row">
            ${TRANSACTION_RULES.qrisMerchants
              .map(
                (m) => `
                <button type="button" class="filter-chip ${m.id === this.merchant.id ? 'active' : ''}" data-pick-merchant="${m.id}">
                  ${m.name}
                </button>
              `
              )
              .join('')}
          </div>
          <button type="button" class="btn btn-primary btn-lg w-full" id="qris-simulate-scan-btn">
            <i data-lucide="scan-line" width="18" height="18"></i>
            Scan QR "${this.merchant.name}"
          </button>
        </div>
      </div>
    `;
  }

  private renderReviewStep(): string {
    const accounts = accountService.getTransactableAccounts();
    return `
      <div class="qris-light-screen">
        <div class="qris-light-topbar">
          <button type="button" class="icon-circle-btn" id="qris-back-scan" aria-label="Kembali ke kamera">
            <i data-lucide="arrow-left" width="18" height="18"></i>
          </button>
          <h2>Review Pembayaran</h2>
          <button type="button" class="icon-circle-btn" id="qris-close-btn" aria-label="Tutup">
            <i data-lucide="x" width="18" height="18"></i>
          </button>
        </div>

        <div class="qris-light-body">
          <div class="qris-merchant-banner">
            <span class="tile-icon-badge is-lime"><i data-lucide="store" width="20" height="20"></i></span>
            <div>
              <strong>${this.merchant.name}</strong>
              <span>${this.merchant.city} • QRIS Nasional</span>
            </div>
          </div>

          <div class="qris-amount-card">
            <label for="qris-review-amount">Nominal Pembayaran</label>
            <div class="input-currency-wrap">
              <span class="currency-prefix">Rp</span>
              <input type="number" id="qris-review-amount" class="input-control qris-amount-input" min="1000" step="1000" value="${this.amount}" />
            </div>
            <div class="quick-amt-row">
              ${TRANSACTION_RULES.quickAmounts
                .map(
                  (amt) =>
                    `<button type="button" class="filter-chip ${this.amount === amt ? 'active' : ''}" data-qris-quick="${amt}">${formatIDR(amt)}</button>`
                )
                .join('')}
            </div>
          </div>

          <div class="qris-method-section">
            <span class="qris-section-label">Sumber Dana</span>
            <div class="qris-method-list">
              ${accounts
                .map((acc) => {
                  const isSel = acc.id === this.selectedAccountId;
                  return `
                    <button type="button" class="qris-method-row ${isSel ? 'active' : ''}" data-qris-acc="${acc.id}">
                      <div class="qris-method-left">
                        <span class="tile-icon-badge"><i data-lucide="${acc.productKind === 'tabungan' ? 'wallet' : 'building-2'}" width="16" height="16"></i></span>
                        <div>
                          <strong>${acc.productKind === 'tabungan' ? 'Tabungan Lentera' : 'Giro Niaga'}</strong>
                          <span>${acc.accountNumber} • Saldo ${formatIDR(acc.balance)}</span>
                        </div>
                      </div>
                      <span class="qris-radio ${isSel ? 'checked' : ''}"></span>
                    </button>
                  `;
                })
                .join('')}
            </div>
          </div>
        </div>

        <div class="qris-review-footer">
          <div>
            <span class="qris-foot-lbl">Total Bayar</span>
            <strong class="qris-foot-val" id="qris-review-total">${formatIDR(this.amount)}</strong>
          </div>
          <button type="button" class="btn btn-primary" id="qris-to-pin-btn">
            Bayar <i data-lucide="arrow-right" width="16" height="16"></i>
          </button>
        </div>
      </div>
    `;
  }

  private renderPinStep(): string {
    const dots = Array.from({ length: 6 }, (_, i) =>
      `<span class="qris-pin-dot ${i < this.pinValue.length ? 'filled' : ''}"></span>`
    ).join('');

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

    return `
      <div class="qris-light-screen">
        <div class="qris-light-topbar">
          <button type="button" class="icon-circle-btn" id="qris-back-review" aria-label="Kembali">
            <i data-lucide="arrow-left" width="18" height="18"></i>
          </button>
          <h2>Masukkan PIN LENTERA</h2>
          <button type="button" class="icon-circle-btn" id="qris-close-btn" aria-label="Tutup">
            <i data-lucide="x" width="18" height="18"></i>
          </button>
        </div>

        <div class="qris-pin-stage">
          <p class="qris-pin-subtitle">
            Konfirmasi pembayaran <strong>${formatIDR(this.amount)}</strong> ke <strong>${this.merchant.name}</strong>
          </p>

          <div class="qris-pin-dots">${dots}</div>

          ${this.pinError ? `<div class="qris-pin-error">${this.pinError}</div>` : `<span class="qris-pin-hint">Masukkan 6 digit PIN apa saja (simulasi)</span>`}
        </div>

        <div class="qris-keypad">
          ${keys
            .map((k) => {
              if (k === '') return `<div class="qris-key-spacer"></div>`;
              if (k === 'back') {
                return `
                  <button type="button" class="qris-key-btn" id="qris-pin-back" aria-label="Hapus digit">
                    <i data-lucide="delete" width="22" height="22"></i>
                  </button>
                `;
              }
              return `<button type="button" class="qris-key-btn" data-pin-digit="${k}">${k}</button>`;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  private renderSuccessStep(): string {
    const r = this.receipt;
    if (!r) return '';
    return `
      <div class="qris-success-screen">
        <div class="qris-success-hero">
          <div class="qris-success-circle">
            <i data-lucide="check" width="42" height="42"></i>
          </div>
          <h2>Pembayaran Berhasil</h2>
          <p class="qris-success-amt">${formatIDR(r.totalDebit)}</p>
          <span class="qris-success-merchant">${r.targetLabel}</span>
        </div>

        <div class="qris-success-receipt">
          <div class="modal-detail-row">
            <span class="modal-detail-label">No. Referensi</span>
            <span class="modal-detail-val">${r.refId}</span>
          </div>
          <div class="modal-detail-row">
            <span class="modal-detail-label">Waktu</span>
            <span class="modal-detail-val">${r.timestamp}</span>
          </div>
          <div class="modal-detail-row">
            <span class="modal-detail-label">Sumber Dana</span>
            <span class="modal-detail-val">${r.sourceAccountNumber}</span>
          </div>
          <div class="modal-detail-row">
            <span class="modal-detail-label">Biaya Admin</span>
            <span class="modal-detail-val">Gratis (Rp 0)</span>
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-lg w-full" id="qris-done-btn">
          Selesai
        </button>
      </div>
    `;
  }

  private bindStepEvents(): void {
    document.getElementById('qris-close-btn')?.addEventListener('click', () => this.close());

    if (this.step === 'scan') {
      document.querySelectorAll<HTMLButtonElement>('[data-pick-merchant]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const found = TRANSACTION_RULES.qrisMerchants.find(
            (m) => m.id === btn.dataset.pickMerchant
          );
          if (found) {
            this.merchant = found;
            this.amount = found.defaultAmount;
            this.render();
          }
        });
      });

      const goReview = (): void => {
        this.step = 'review';
        this.render();
      };
      document.getElementById('qris-simulate-scan-btn')?.addEventListener('click', goReview);
      document.getElementById('qris-reticle-tap')?.addEventListener('click', goReview);
    }

    if (this.step === 'review') {
      document.getElementById('qris-back-scan')?.addEventListener('click', () => {
        this.step = 'scan';
        this.render();
      });

      const amtInput = document.getElementById('qris-review-amount') as HTMLInputElement | null;
      const totalEl = document.getElementById('qris-review-total');
      amtInput?.addEventListener('input', () => {
        this.amount = Math.max(0, Number(amtInput.value) || 0);
        if (totalEl) totalEl.textContent = formatIDR(this.amount);
      });

      document.querySelectorAll<HTMLButtonElement>('[data-qris-quick]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.amount = Number(btn.dataset.qrisQuick) || this.amount;
          this.render();
        });
      });

      document.querySelectorAll<HTMLButtonElement>('[data-qris-acc]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.selectedAccountId = btn.dataset.qrisAcc ?? this.selectedAccountId;
          this.render();
        });
      });

      document.getElementById('qris-to-pin-btn')?.addEventListener('click', () => {
        if (this.amount < 1000) return;
        this.pinValue = '';
        this.pinError = '';
        this.step = 'pin';
        this.render();
      });
    }

    if (this.step === 'pin') {
      document.getElementById('qris-back-review')?.addEventListener('click', () => {
        this.step = 'review';
        this.render();
      });

      document.querySelectorAll<HTMLButtonElement>('[data-pin-digit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const d = btn.dataset.pinDigit;
          if (d) this.appendPinDigit(d);
        });
      });

      document.getElementById('qris-pin-back')?.addEventListener('click', () => {
        this.backspacePin();
      });
    }

    if (this.step === 'success') {
      document.getElementById('qris-done-btn')?.addEventListener('click', () => {
        const cb = this.onCompleteCallback;
        this.close();
        cb?.();
      });
    }
  }

  private appendPinDigit(digit: string): void {
    if (this.pinValue.length >= 6) return;
    this.pinValue += digit;
    this.pinError = '';
    this.render();

    if (this.pinValue.length === 6) {
      const res = transferService.execute({
        mode: 'qris',
        sourceAccountId: this.selectedAccountId,
        targetLabel: `${this.merchant.name} (${this.merchant.city})`,
        description: `QRIS ${this.merchant.name}`,
        amount: this.amount,
        fee: 0,
      });

      if (!res.ok) {
        this.pinValue = '';
        this.pinError = res.error;
        this.render();
        return;
      }

      this.receipt = res.receipt;
      this.step = 'success';
      this.render();
    }
  }

  private backspacePin(): void {
    if (this.pinValue.length === 0) return;
    this.pinValue = this.pinValue.slice(0, -1);
    this.render();
  }
}

export const qrisFlowController = new QrisFlowController();
