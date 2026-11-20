import { renderLucideIcons } from './icons.ts';

export interface ModalDetailRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ModalPayload {
  badge: string;
  title: string;
  subtitle: string;
  rows: readonly ModalDetailRow[];
  ctaLabel?: string;
  onConfirm?: () => void;
}

/**
 * Tanggung jawab tunggal: Menampilkan dan menutup modal konfirmasi sukses
 * (Kartu Virtual, e-Bilyet Deposito, Surat Konfirmasi Giro, atau Preview Sheet).
 */
class ModalController {
  private overlay: HTMLElement | null = null;
  private badgeEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private subtitleEl: HTMLElement | null = null;
  private detailsEl: HTMLElement | null = null;
  private ctaBtn: HTMLButtonElement | null = null;
  private onConfirmCallback: (() => void) | null = null;

  public init(): void {
    this.overlay = document.getElementById('app-modal');
    this.badgeEl = document.getElementById('modal-badge');
    this.titleEl = document.getElementById('modal-title');
    this.subtitleEl = document.getElementById('modal-subtitle');
    this.detailsEl = document.getElementById('modal-details');
    this.ctaBtn = document.getElementById('modal-cta-btn') as HTMLButtonElement | null;

    const closeBtn = document.getElementById('modal-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    this.ctaBtn?.addEventListener('click', () => {
      const cb = this.onConfirmCallback;
      this.close();
      cb?.();
    });

    this.overlay?.addEventListener('click', (event) => {
      if (event.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });
  }

  public show(payload: ModalPayload): void {
    if (!this.overlay) return;

    this.onConfirmCallback = payload.onConfirm ?? null;
    if (this.badgeEl) this.badgeEl.textContent = payload.badge;
    if (this.titleEl) this.titleEl.textContent = payload.title;
    if (this.subtitleEl) this.subtitleEl.textContent = payload.subtitle;
    if (this.ctaBtn) {
      this.ctaBtn.textContent = payload.ctaLabel ?? 'Selesai';
    }

    if (this.detailsEl) {
      this.detailsEl.innerHTML = payload.rows
        .map(
          (row) => `
          <div class="modal-detail-row">
            <span class="modal-detail-label">${row.label}</span>
            <span class="modal-detail-val ${row.highlight ? 'is-highlight' : ''}">${row.value}</span>
          </div>`
        )
        .join('');
    }

    this.overlay.classList.add('active');
    this.overlay.setAttribute('aria-hidden', 'false');
    renderLucideIcons();
  }

  public close(): void {
    if (!this.overlay) return;
    this.overlay.classList.remove('active');
    this.overlay.setAttribute('aria-hidden', 'true');
    this.onConfirmCallback = null;
  }
}

export const modalController = new ModalController();
