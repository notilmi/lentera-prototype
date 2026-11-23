import { TRANSACTION_RULES } from '../config/product-rules.ts';
import { accountService } from '../services/account.service.ts';
import { formatIDR } from '../services/format.service.ts';
import { transferService } from '../services/transfer.service.ts';
import type { RouteParams, TransaksiMode } from '../types/navigation.ts';
import { renderLucideIcons } from '../ui/icons.ts';
import { modalController } from '../ui/modal.controller.ts';

interface ServiceModeMeta {
  id: TransaksiMode;
  icon: string;
  title: string;
  sub: string;
}

const SERVICE_MODES: readonly ServiceModeMeta[] = [
  { id: 'transfer', icon: 'send', title: 'Transfer Dana', sub: 'Sesama & Antar Bank' },
  { id: 'qris', icon: 'qr-code', title: 'Bayar QRIS', sub: 'Scan Merchant Instan' },
  { id: 'tagihan', icon: 'receipt-text', title: 'Tagihan', sub: 'PLN, PDAM, BPJS' },
  { id: 'ewallet', icon: 'smartphone', title: 'e-Wallet', sub: 'GoPay, OVO, DANA' },
];

let activeMode: TransaksiMode = 'transfer';
let selectedQrisMerchantId: string = TRANSACTION_RULES.qrisMerchants[0].id;

function renderSourceAccountField(): string {
  const accounts = accountService.getTransactableAccounts();
  return `
    <div class="form-group full-width">
      <label for="tx-source-acc">Rekening Sumber Dana</label>
      <select id="tx-source-acc" class="input-control" required>
        ${accounts
          .map(
            (acc) =>
              `<option value="${acc.id}">${acc.productKind === 'tabungan' ? 'Tabungan Lentera' : 'Giro Niaga'} (${acc.accountNumber}) — ${formatIDR(acc.balance)}</option>`
          )
          .join('')}
      </select>
    </div>
  `;
}

function renderQuickAmountPills(targetInputId: string): string {
  return `
    <div class="quick-amt-row">
      ${TRANSACTION_RULES.quickAmounts
        .map(
          (amt) =>
            `<button type="button" class="filter-chip" data-quick-amt="${amt}" data-amt-target="${targetInputId}">${formatIDR(amt)}</button>`
        )
        .join('')}
    </div>
  `;
}

function renderTransferForm(): string {
  return `
    <div class="pane-header">
      <div>
        <h3>Transfer Dana</h3>
        <p>Gratis biaya admin sesama LENTERA Bank, atau Rp 2.500 antar bank nasional.</p>
      </div>
      <span class="pill-badge badge-lime">Real-time</span>
    </div>
    <form id="tx-form-transfer">
      <div class="form-grid">
        ${renderSourceAccountField()}
        <div class="form-group">
          <label for="tr-bank">Bank Tujuan</label>
          <select id="tr-bank" class="input-control" required>
            ${TRANSACTION_RULES.transferBanks
              .map(
                (b) =>
                  `<option value="${b.code}" data-fee="${b.fee}">${b.name} (${b.fee === 0 ? 'Gratis' : formatIDR(b.fee)})</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="tr-target-acc">Nomor Rekening Tujuan</label>
          <input type="text" id="tr-target-acc" class="input-control" placeholder="Contoh: 882011223344" value="882099112233" required />
        </div>
        <div class="form-group">
          <label for="tr-amount">Nominal Transfer</label>
          <div class="input-currency-wrap">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="tr-amount" class="input-control" min="10000" step="5000" value="150000" required />
          </div>
          ${renderQuickAmountPills('tr-amount')}
        </div>
        <div class="form-group">
          <label for="tr-note">Catatan (Opsional)</label>
          <input type="text" id="tr-note" class="input-control" placeholder="Contoh: Bayar patungan makan" />
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-lg w-full" style="margin-top: 16px;">
        <i data-lucide="send" width="18" height="18"></i>
        Kirim Transfer Sekarang
      </button>
    </form>
  `;
}

function renderQrisForm(): string {
  const merchant =
    TRANSACTION_RULES.qrisMerchants.find((m) => m.id === selectedQrisMerchantId) ??
    TRANSACTION_RULES.qrisMerchants[0];

  return `
    <div class="pane-header">
      <div>
        <h3>Pembayaran QRIS</h3>
        <p>Pilih merchant QRIS simulasi atau masukkan nominal transaksi secara langsung.</p>
      </div>
      <span class="pill-badge badge-lime">Bebas Biaya</span>
    </div>

    <div class="qris-viewfinder">
      <div class="qris-frame-box">
        <i data-lucide="qr-code" width="44" height="44"></i>
        <span>Simulasi Kamera QRIS Aktif</span>
      </div>
      <div class="qris-preset-list">
        <span class="qris-preset-label">Merchant Terdeteksi (Klik untuk pilih):</span>
        <div class="filter-chip-row">
          ${TRANSACTION_RULES.qrisMerchants
            .map(
              (m) =>
                `<button type="button" class="filter-chip ${m.id === merchant.id ? 'active' : ''}" data-qris-merchant="${m.id}">${m.name}</button>`
            )
            .join('')}
        </div>
      </div>
    </div>

    <form id="tx-form-qris">
      <div class="form-grid">
        ${renderSourceAccountField()}
        <div class="form-group">
          <label for="qr-merchant-name">Nama Merchant</label>
          <input type="text" id="qr-merchant-name" class="input-control" value="${merchant.name} (${merchant.city})" readonly />
        </div>
        <div class="form-group">
          <label for="qr-amount">Nominal Pembayaran</label>
          <div class="input-currency-wrap">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="qr-amount" class="input-control" min="1000" step="1000" value="${merchant.defaultAmount}" required />
          </div>
          ${renderQuickAmountPills('qr-amount')}
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-lg w-full" style="margin-top: 16px;">
        <i data-lucide="qr-code" width="18" height="18"></i>
        Bayar via QRIS
      </button>
    </form>
  `;
}

function renderTagihanForm(): string {
  const firstCat = TRANSACTION_RULES.billCategories[0];
  return `
    <div class="pane-header">
      <div>
        <h3>Pembayaran Tagihan</h3>
        <p>Bayar listrik PLN, PDAM, internet, BPJS Kesehatan, hingga pulsa seluler.</p>
      </div>
      <span class="pill-badge">Otomatis</span>
    </div>
    <form id="tx-form-tagihan">
      <div class="form-grid">
        ${renderSourceAccountField()}
        <div class="form-group">
          <label for="tg-category">Kategori Tagihan</label>
          <select id="tg-category" class="input-control" required>
            ${TRANSACTION_RULES.billCategories
              .map(
                (c) =>
                  `<option value="${c.id}" data-fee="${c.fee}" data-sample="${c.sampleAmount}">${c.label} (Admin ${formatIDR(c.fee)})</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="tg-customer-id">ID Pelanggan / Nomor Meter</label>
          <input type="text" id="tg-customer-id" class="input-control" value="530019283746" required />
        </div>
        <div class="form-group full-width">
          <label for="tg-amount">Nominal Tagihan</label>
          <div class="input-currency-wrap">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="tg-amount" class="input-control" min="10000" step="1000" value="${firstCat.sampleAmount}" required />
          </div>
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-lg w-full" style="margin-top: 16px;">
        <i data-lucide="receipt-text" width="18" height="18"></i>
        Bayar Tagihan Sekarang
      </button>
    </form>
  `;
}

function renderEwalletForm(): string {
  return `
    <div class="pane-header">
      <div>
        <h3>Top Up e-Wallet</h3>
        <p>Isi saldo dompet digital langsung dari rekening Tabungan atau Giro Anda.</p>
      </div>
      <span class="pill-badge badge-lime">Instan</span>
    </div>
    <form id="tx-form-ewallet">
      <div class="form-grid">
        ${renderSourceAccountField()}
        <div class="form-group">
          <label for="ew-provider">Dompet Digital</label>
          <select id="ew-provider" class="input-control" required>
            ${TRANSACTION_RULES.ewallets
              .map((w) => `<option value="${w.id}" data-fee="${w.fee}">${w.name} (Admin ${formatIDR(w.fee)})</option>`)
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="ew-phone">Nomor HP Terdaftar</label>
          <input type="tel" id="ew-phone" class="input-control" value="081273890012" required />
        </div>
        <div class="form-group full-width">
          <label for="ew-amount">Nominal Top Up</label>
          <div class="input-currency-wrap">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="ew-amount" class="input-control" min="10000" step="10000" value="100000" required />
          </div>
          ${renderQuickAmountPills('ew-amount')}
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-lg w-full" style="margin-top: 16px;">
        <i data-lucide="smartphone" width="18" height="18"></i>
        Top Up Sekarang
      </button>
    </form>
  `;
}

/**
 * Tanggung jawab tunggal: Merender layar Transaksi Digital (Tahap 3)
 * meliputi Transfer Dana, QRIS, Tagihan, dan Top Up e-Wallet.
 */
export function renderTransaksiScreen(container: HTMLElement, params?: RouteParams): void {
  if (params?.txMode) {
    activeMode = params.txMode;
  }

  const draw = (): void => {
    const formHtml =
      activeMode === 'transfer'
        ? renderTransferForm()
        : activeMode === 'qris'
          ? renderQrisForm()
          : activeMode === 'tagihan'
            ? renderTagihanForm()
            : renderEwalletForm();

    container.innerHTML = `
      <div class="screen-stack">
        <div class="service-mode-grid">
          ${SERVICE_MODES.map(
            (svc) => `
            <button type="button" class="service-mode-btn ${activeMode === svc.id ? 'active' : ''}" data-tx-mode="${svc.id}">
              <span class="tile-icon-badge ${activeMode === svc.id ? 'is-lime' : ''}">
                <i data-lucide="${svc.icon}" width="18" height="18"></i>
              </span>
              <div class="service-mode-text">
                <strong>${svc.title}</strong>
                <span>${svc.sub}</span>
              </div>
            </button>
          `
          ).join('')}
        </div>

        <div class="surface-plate">
          ${formHtml}
        </div>
      </div>
    `;

    bindEvents(draw);
    renderLucideIcons();
  };

  const showTxReceipt = (
    title: string,
    payload: {
      refId: string;
      timestamp: string;
      sourceAccountNumber: string;
      targetLabel: string;
      amount: number;
      fee: number;
      totalDebit: number;
    }
  ): void => {
    modalController.show({
      badge: 'Transaksi Berhasil',
      title,
      subtitle: `Ref: ${payload.refId} • ${payload.timestamp}`,
      rows: [
        { label: 'Rekening Sumber', value: payload.sourceAccountNumber },
        { label: 'Tujuan', value: payload.targetLabel },
        { label: 'Nominal', value: formatIDR(payload.amount) },
        { label: 'Biaya Admin', value: payload.fee === 0 ? 'Gratis (Rp 0)' : formatIDR(payload.fee) },
        { label: 'Total Didebit', value: formatIDR(payload.totalDebit), highlight: true },
      ],
      ctaLabel: 'Selesai',
      onConfirm: () => draw(),
    });
  };

  const showTxError = (msg: string): void => {
    modalController.show({
      badge: 'Transaksi Gagal',
      title: 'Tidak Dapat Diproses',
      subtitle: msg,
      rows: [],
      ctaLabel: 'Perbaiki',
    });
  };

  const bindEvents = (redraw: () => void): void => {
    container.querySelectorAll<HTMLButtonElement>('[data-tx-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeMode = btn.dataset.txMode as TransaksiMode;
        redraw();
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-quick-amt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.amtTarget;
        const amt = btn.dataset.quickAmt;
        if (!targetId || !amt) return;
        const input = document.getElementById(targetId) as HTMLInputElement | null;
        if (input) input.value = amt;
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-qris-merchant]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedQrisMerchantId = btn.dataset.qrisMerchant ?? TRANSACTION_RULES.qrisMerchants[0].id;
        redraw();
      });
    });

    document.getElementById('tg-category')?.addEventListener('change', (e) => {
      const sel = e.target as HTMLSelectElement;
      const sample = sel.selectedOptions[0]?.dataset.sample;
      const amtInput = document.getElementById('tg-amount') as HTMLInputElement | null;
      if (sample && amtInput) amtInput.value = sample;
    });

    const getSourceAccountId = (): string =>
      (document.getElementById('tx-source-acc') as HTMLSelectElement | null)?.value ?? '';

    document.getElementById('tx-form-transfer')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const bankSel = document.getElementById('tr-bank') as HTMLSelectElement;
      const bankCode = bankSel.value;
      const fee = Number(bankSel.selectedOptions[0]?.dataset.fee ?? 0);
      const targetAcc = (document.getElementById('tr-target-acc') as HTMLInputElement).value.trim();
      const amount = Number((document.getElementById('tr-amount') as HTMLInputElement).value);
      const note = (document.getElementById('tr-note') as HTMLInputElement).value.trim();

      const res = transferService.execute({
        mode: 'transfer',
        sourceAccountId: getSourceAccountId(),
        targetLabel: `${bankCode} • ${targetAcc}`,
        description: `Transfer ke ${bankCode} (${targetAcc})${note ? ` — ${note}` : ''}`,
        amount,
        fee,
      });
      if (!res.ok) return showTxError(res.error);
      showTxReceipt('Transfer Dana Terkirim', res.receipt);
    });

    document.getElementById('tx-form-qris')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const merchantName = (document.getElementById('qr-merchant-name') as HTMLInputElement).value;
      const amount = Number((document.getElementById('qr-amount') as HTMLInputElement).value);

      const res = transferService.execute({
        mode: 'qris',
        sourceAccountId: getSourceAccountId(),
        targetLabel: merchantName,
        description: `QRIS ${merchantName}`,
        amount,
        fee: 0,
      });
      if (!res.ok) return showTxError(res.error);
      showTxReceipt('Pembayaran QRIS Berhasil', res.receipt);
    });

    document.getElementById('tx-form-tagihan')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const catSel = document.getElementById('tg-category') as HTMLSelectElement;
      const catLabel = catSel.selectedOptions[0]?.textContent?.split(' (')[0] ?? 'Tagihan';
      const fee = Number(catSel.selectedOptions[0]?.dataset.fee ?? 0);
      const custId = (document.getElementById('tg-customer-id') as HTMLInputElement).value.trim();
      const amount = Number((document.getElementById('tg-amount') as HTMLInputElement).value);

      const res = transferService.execute({
        mode: 'tagihan',
        sourceAccountId: getSourceAccountId(),
        targetLabel: `${catLabel} • ${custId}`,
        description: `Bayar ${catLabel} (${custId})`,
        amount,
        fee,
      });
      if (!res.ok) return showTxError(res.error);
      showTxReceipt('Pembayaran Tagihan Lunas', res.receipt);
    });

    document.getElementById('tx-form-ewallet')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const ewSel = document.getElementById('ew-provider') as HTMLSelectElement;
      const ewName = ewSel.selectedOptions[0]?.textContent?.split(' (')[0] ?? 'e-Wallet';
      const fee = Number(ewSel.selectedOptions[0]?.dataset.fee ?? 0);
      const phone = (document.getElementById('ew-phone') as HTMLInputElement).value.trim();
      const amount = Number((document.getElementById('ew-amount') as HTMLInputElement).value);

      const res = transferService.execute({
        mode: 'ewallet',
        sourceAccountId: getSourceAccountId(),
        targetLabel: `${ewName} • ${phone}`,
        description: `Top Up ${ewName} (${phone})`,
        amount,
        fee,
      });
      if (!res.ok) return showTxError(res.error);
      showTxReceipt(`Top Up ${ewName} Berhasil`, res.receipt);
    });
  };

  draw();
}
