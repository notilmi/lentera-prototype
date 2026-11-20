import { accountService } from '../services/account.service.ts';
import { formatIDR } from '../services/format.service.ts';
import { ledgerService } from '../services/ledger.service.ts';
import { routerService } from '../services/router.service.ts';
import type { BankAccount } from '../types/account.ts';
import { renderLucideIcons } from '../ui/icons.ts';

let hideBalance = false;

function formatMaskedBalance(amount: number): string {
  return hideBalance ? 'Rp ••••••••' : formatIDR(amount);
}

function getAccountMeta(account: BankAccount): { icon: string; badge: string; sub: string } {
  if (account.productKind === 'tabungan') {
    return {
      icon: 'wallet',
      badge: 'Tabungan',
      sub: `${account.interestRatePa.toFixed(2)}% p.a. • Admin Rp 0`,
    };
  }
  if (account.productKind === 'deposito') {
    return {
      icon: 'trending-up',
      badge: `Deposito ${account.tenorMonths} Bln`,
      sub: `Jatuh tempo ${account.maturityDate}`,
    };
  }
  return {
    icon: 'building-2',
    badge: 'Giro Niaga',
    sub: account.category === 'badan_usaha' ? 'Badan Usaha' : 'Perorangan Usaha',
  };
}

/**
 * Tanggung jawab tunggal: Merender layar Beranda (Home) m-banking.
 */
export function renderHomeScreen(container: HTMLElement): void {
  const accounts = accountService.getAccounts();
  const summary = accountService.getSummary();
  const recentTx = ledgerService.getEntries().slice(0, 4);

  container.innerHTML = `
    <div class="screen-stack">
      <!-- Total Balance Dark Ink Card -->
      <section class="balance-hero-card">
        <div class="balance-hero-top">
          <span class="balance-hero-label">Total Saldo Simpanan</span>
          <button type="button" class="icon-toggle-btn" id="home-eye-toggle" aria-label="Sembunyikan atau tampilkan saldo">
            <i data-lucide="${hideBalance ? 'eye-off' : 'eye'}" width="18" height="18"></i>
          </button>
        </div>

        <div class="balance-hero-amount">${formatMaskedBalance(summary.totalBalance)}</div>

        <div class="balance-hero-pills">
          <span class="dark-pill">
            <i data-lucide="layers" width="14" height="14"></i>
            ${summary.accountCount} Rekening Aktif
          </span>
          <span class="dark-pill">Tabungan: ${formatMaskedBalance(summary.savingsTotal)}</span>
          ${summary.depositTotal > 0 ? `<span class="dark-pill">Deposito: ${formatMaskedBalance(summary.depositTotal)}</span>` : ''}
          ${summary.giroTotal > 0 ? `<span class="dark-pill">Giro: ${formatMaskedBalance(summary.giroTotal)}</span>` : ''}
        </div>
      </section>

      <!-- Quick Action Row -->
      <section class="quick-actions-grid">
        <button type="button" class="quick-action-tile" id="qa-open-product">
          <span class="qa-circle is-primary"><i data-lucide="plus" width="20" height="20"></i></span>
          <span class="qa-label">Buka Simpanan</span>
        </button>
        <button type="button" class="quick-action-tile" id="qa-calculator">
          <span class="qa-circle"><i data-lucide="calculator" width="20" height="20"></i></span>
          <span class="qa-label">Kalkulator</span>
        </button>
        <button type="button" class="quick-action-tile" id="qa-transfer">
          <span class="qa-circle"><i data-lucide="send" width="20" height="20"></i></span>
          <span class="qa-label">Transfer <small class="qa-tag">Soon</small></span>
        </button>
        <button type="button" class="quick-action-tile" id="qa-qris">
          <span class="qa-circle"><i data-lucide="qr-code" width="20" height="20"></i></span>
          <span class="qa-label">QRIS <small class="qa-tag">Soon</small></span>
        </button>
      </section>

      <!-- Rekening & Kantong Saya -->
      <section class="app-section">
        <div class="app-section-head">
          <h2>Rekening Saya</h2>
          <button type="button" class="text-link-btn" id="home-see-simpanan">
            Kelola Semua <i data-lucide="chevron-right" width="16" height="16"></i>
          </button>
        </div>

        <div class="account-tiles-grid">
          ${accounts
            .map((acc) => {
              const meta = getAccountMeta(acc);
              return `
                <button type="button" class="account-tile-card" data-open-account="${acc.id}">
                  <div class="tile-top">
                    <span class="tile-icon-badge"><i data-lucide="${meta.icon}" width="18" height="18"></i></span>
                    <span class="pill-badge">${meta.badge}</span>
                  </div>
                  <div class="tile-amount">${formatMaskedBalance(acc.balance)}</div>
                  <div class="tile-meta">
                    <strong>${acc.accountNumber}</strong>
                    <span>${meta.sub}</span>
                  </div>
                </button>
              `;
            })
            .join('')}

          <button type="button" class="account-tile-add" id="home-add-account">
            <span class="add-icon-circle"><i data-lucide="plus" width="20" height="20"></i></span>
            <strong>Tambah Produk Simpanan</strong>
            <span>Buka Tabungan, Deposito, atau Giro</span>
          </button>
        </div>
      </section>

      <!-- Aktivitas Terbaru -->
      <section class="app-section">
        <div class="app-section-head">
          <h2>Aktivitas Terbaru</h2>
          <button type="button" class="text-link-btn" id="home-see-riwayat">
            Lihat Semua <i data-lucide="chevron-right" width="16" height="16"></i>
          </button>
        </div>

        <div class="surface-plate">
          <ul class="activity-list">
            ${recentTx
              .map(
                (tx) => `
                <li class="activity-row">
                  <div class="activity-left">
                    <span class="activity-icon"><i data-lucide="arrow-down-left" width="16" height="16"></i></span>
                    <div>
                      <strong class="activity-title">${tx.description}</strong>
                      <span class="activity-sub">${tx.accountNumber} • ${tx.timestamp}</span>
                    </div>
                  </div>
                  <span class="activity-amount is-credit">+ ${formatIDR(tx.amount)}</span>
                </li>
              `
              )
              .join('')}
          </ul>
        </div>
      </section>
    </div>
  `;

  document.getElementById('home-eye-toggle')?.addEventListener('click', () => {
    hideBalance = !hideBalance;
    renderHomeScreen(container);
    renderLucideIcons();
  });

  document.getElementById('qa-open-product')?.addEventListener('click', () => {
    routerService.navigate('simpanan', { simpananTab: 'catalog' });
  });

  document.getElementById('qa-calculator')?.addEventListener('click', () => {
    routerService.navigate('simpanan', { simpananTab: 'calculator' });
  });

  document.getElementById('qa-transfer')?.addEventListener('click', () => {
    routerService.navigate('transaksi');
  });

  document.getElementById('qa-qris')?.addEventListener('click', () => {
    routerService.navigate('transaksi');
  });

  document.getElementById('home-see-simpanan')?.addEventListener('click', () => {
    routerService.navigate('simpanan', { simpananTab: 'accounts' });
  });

  document.getElementById('home-add-account')?.addEventListener('click', () => {
    routerService.navigate('simpanan', { simpananTab: 'catalog' });
  });

  document.getElementById('home-see-riwayat')?.addEventListener('click', () => {
    routerService.navigate('riwayat');
  });

  container.querySelectorAll<HTMLButtonElement>('[data-open-account]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const accountId = btn.dataset.openAccount;
      if (accountId) routerService.navigate('account-detail', { accountId });
    });
  });
}
