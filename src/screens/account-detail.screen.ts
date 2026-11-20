import { GIRO_FACILITY_LABELS, ROLLOVER_LABELS } from '../config/product-rules.ts';
import { accountService } from '../services/account.service.ts';
import { formatIDR } from '../services/format.service.ts';
import { ledgerService } from '../services/ledger.service.ts';
import { routerService } from '../services/router.service.ts';
import type { BankAccount } from '../types/account.ts';
import type { RouteParams } from '../types/navigation.ts';

function renderProductSpecificHero(account: BankAccount): string {
  if (account.productKind === 'tabungan') {
    return `
      <div class="virtual-debit-card">
        <div class="card-top-row">
          <span class="card-chip-badge"><i data-lucide="credit-card" width="14" height="14"></i> Kartu Debit Virtual</span>
          <span class="card-brand-text">LENTERA</span>
        </div>
        <div class="card-number-display">${account.cardNumber}</div>
        <div class="card-bottom-row">
          <div>
            <span class="card-meta-label">Pemegang Rekening</span>
            <div class="card-holder-value">${account.holderName.toUpperCase()}</div>
          </div>
          <div>
            <span class="card-meta-label">Berlaku S/D</span>
            <div class="card-holder-value">${account.cardExpiry}</div>
          </div>
          <span class="pill-badge badge-lime">GPN DIGITAL</span>
        </div>
      </div>
    `;
  }

  if (account.productKind === 'deposito') {
    return `
      <div class="virtual-debit-card">
        <div class="card-top-row">
          <span class="card-chip-badge"><i data-lucide="file-check-2" width="14" height="14"></i> e-Bilyet Deposito</span>
          <span class="card-brand-text">${account.certificateNumber}</span>
        </div>
        <div class="card-number-display">${formatIDR(account.balance)}</div>
        <div class="card-bottom-row">
          <div>
            <span class="card-meta-label">Jatuh Tempo (${account.tenorMonths} Bln)</span>
            <div class="card-holder-value">${account.maturityDate}</div>
          </div>
          <div>
            <span class="card-meta-label">Estimasi Cair</span>
            <div class="card-holder-value" style="color: #9fe870">${formatIDR(account.estimatedMaturityTotal)}</div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="virtual-debit-card">
      <div class="card-top-row">
        <span class="card-chip-badge"><i data-lucide="building-2" width="14" height="14"></i> Rekening Giro Niaga</span>
        <span class="card-brand-text">LENTERA</span>
      </div>
      <div class="card-number-display">${account.accountNumber}</div>
      <div class="card-bottom-row">
        <div>
          <span class="card-meta-label">Entitas / Pemilik</span>
          <div class="card-holder-value">${account.holderName}</div>
        </div>
        <div>
          <span class="card-meta-label">NPWP</span>
          <div class="card-holder-value">${account.npwp}</div>
        </div>
      </div>
    </div>
  `;
}

function renderSpecRows(account: BankAccount): string {
  if (account.productKind === 'tabungan') {
    return `
      <li><span>Nomor Rekening</span><strong>${account.accountNumber}</strong></li>
      <li><span>Saldo Aktif</span><strong class="text-positive">${formatIDR(account.balance)}</strong></li>
      <li><span>Suku Bunga Harian</span><strong>${account.interestRatePa.toFixed(2)}% p.a.</strong></li>
      <li><span>Biaya Administrasi</span><strong>Rp 0 / Bulan</strong></li>
      <li><span>Tanggal Pembukaan</span><strong>${account.openedAt}</strong></li>
    `;
  }

  if (account.productKind === 'deposito') {
    return `
      <li><span>Nomor Rekening</span><strong>${account.accountNumber}</strong></li>
      <li><span>Nomor e-Bilyet</span><strong>${account.certificateNumber}</strong></li>
      <li><span>Nominal Pokok</span><strong>${formatIDR(account.balance)}</strong></li>
      <li><span>Suku Bunga & Tenor</span><strong>${account.interestRatePa.toFixed(2)}% p.a. (${account.tenorMonths} Bln)</strong></li>
      <li><span>Instruksi Rollover</span><strong>${ROLLOVER_LABELS[account.rolloverMode]}</strong></li>
      <li><span>Estimasi Bunga Bersih</span><strong class="text-positive">+ ${formatIDR(account.estimatedNetInterest)}</strong></li>
    `;
  }

  return `
    <li><span>Nomor Rekening Giro</span><strong>${account.accountNumber}</strong></li>
    <li><span>Saldo Giro Aktif</span><strong class="text-positive">${formatIDR(account.balance)}</strong></li>
    <li><span>Segmen</span><strong>${account.category === 'badan_usaha' ? 'Badan Usaha' : 'Perorangan Usaha'}</strong></li>
    <li><span>Bidang Usaha</span><strong>${account.businessSector}</strong></li>
    <li><span>Fasilitas Penarikan</span><strong>${GIRO_FACILITY_LABELS[account.facility]}</strong></li>
    <li><span>Jasa Giro & Admin</span><strong>${account.giroRatePa.toFixed(2)}% p.a. • ${formatIDR(account.monthlyAdminFee)}/bln</strong></li>
  `;
}

/**
 * Tanggung jawab tunggal: Merender sub-layar Detail Rekening (Kartu Virtual / e-Bilyet / Giro)
 * beserta daftar mutasi khusus rekening tersebut.
 */
export function renderAccountDetailScreen(container: HTMLElement, params?: RouteParams): void {
  const account = params?.accountId ? accountService.getAccountById(params.accountId) : undefined;

  if (!account) {
    container.innerHTML = `
      <div class="surface-plate empty-inline">
        <i data-lucide="inbox" width="28" height="28"></i>
        <p>Rekening tidak ditemukan.</p>
        <button type="button" class="btn btn-primary btn-sm" id="detail-go-home">Kembali ke Beranda</button>
      </div>
    `;
    document.getElementById('detail-go-home')?.addEventListener('click', () => routerService.navigate('home'));
    return;
  }

  const accountTx = ledgerService.getEntriesByAccountNumber(account.accountNumber);

  container.innerHTML = `
    <div class="screen-stack">
      ${renderProductSpecificHero(account)}

      <div class="surface-plate">
        <div class="plate-head-row">
          <h3>Informasi Rekening</h3>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-acc">
            <i data-lucide="copy" width="14" height="14"></i> Salin No. Rek
          </button>
        </div>
        <ul class="spec-list detail-spec-list">
          ${renderSpecRows(account)}
        </ul>
      </div>

      <div class="surface-plate">
        <div class="plate-head-row">
          <h3>Mutasi Rekening Ini</h3>
          <span class="pill-badge">${accountTx.length} Transaksi</span>
        </div>
        ${
          accountTx.length > 0
            ? `<ul class="activity-list">
                ${accountTx
                  .map(
                    (tx) => `
                    <li class="activity-row">
                      <div class="activity-left">
                        <span class="activity-icon"><i data-lucide="arrow-down-left" width="16" height="16"></i></span>
                        <div>
                          <strong class="activity-title">${tx.description}</strong>
                          <span class="activity-sub">${tx.timestamp}</span>
                        </div>
                      </div>
                      <span class="activity-amount is-credit">+ ${formatIDR(tx.amount)}</span>
                    </li>
                  `
                  )
                  .join('')}
              </ul>`
            : `<p class="text-muted">Belum ada mutasi tercatat pada rekening ini.</p>`
        }
      </div>
    </div>
  `;

  document.getElementById('btn-copy-acc')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(account.accountNumber).catch(() => {});
    const btn = document.getElementById('btn-copy-acc');
    if (btn) btn.textContent = 'Tersalin!';
  });
}
