import { PRODUCT_RULES } from '../config/product-rules.ts';
import { accountService } from '../services/account.service.ts';
import { calculateDepositYield } from '../services/calculator.service.ts';
import { formatIDR } from '../services/format.service.ts';
import { routerService } from '../services/router.service.ts';
import type { BankAccount, ProductKind } from '../types/account.ts';
import type { RouteParams, SimpananSubTab } from '../types/navigation.ts';
import { renderLucideIcons } from '../ui/icons.ts';

let activeAccountFilter: 'all' | ProductKind = 'all';
let calcAmount = 10_000_000;
let calcTenor = 6;

function renderAccountRow(account: BankAccount): string {
  const icon =
    account.productKind === 'tabungan'
      ? 'wallet'
      : account.productKind === 'deposito'
        ? 'trending-up'
        : 'building-2';
  const label =
    account.productKind === 'tabungan'
      ? 'Tabungan Lentera'
      : account.productKind === 'deposito'
        ? `Deposito ${account.tenorMonths} Bulan`
        : 'Giro Lentera Niaga';
  const detail =
    account.productKind === 'deposito'
      ? `e-Bilyet ${account.certificateNumber} • Jatuh tempo ${account.maturityDate}`
      : account.productKind === 'giro'
        ? `${account.holderName} • NPWP ${account.npwp}`
        : `${account.holderName} • Bunga ${account.interestRatePa.toFixed(2)}% p.a.`;

  return `
    <button type="button" class="account-list-row" data-detail-id="${account.id}">
      <div class="account-list-left">
        <span class="tile-icon-badge"><i data-lucide="${icon}" width="18" height="18"></i></span>
        <div>
          <strong>${label}</strong>
          <span class="row-sub">${account.accountNumber} • ${detail}</span>
        </div>
      </div>
      <div class="account-list-right">
        <strong>${formatIDR(account.balance)}</strong>
        <i data-lucide="chevron-right" width="16" height="16"></i>
      </div>
    </button>
  `;
}

function renderAccountsTab(): string {
  const allAccounts = accountService.getAccounts();
  const filtered =
    activeAccountFilter === 'all'
      ? allAccounts
      : allAccounts.filter((acc) => acc.productKind === activeAccountFilter);

  return `
    <div class="filter-chip-row">
      ${(['all', 'tabungan', 'deposito', 'giro'] as const)
        .map((key) => {
          const labels = {
            all: 'Semua',
            tabungan: 'Tabungan',
            deposito: 'Deposito',
            giro: 'Giro',
          };
          return `<button type="button" class="filter-chip ${activeAccountFilter === key ? 'active' : ''}" data-acc-filter="${key}">${labels[key]}</button>`;
        })
        .join('')}
    </div>

    <div class="surface-plate">
      ${
        filtered.length > 0
          ? `<div class="account-list-stack">${filtered.map(renderAccountRow).join('')}</div>`
          : `<div class="empty-inline">
              <i data-lucide="inbox" width="28" height="28"></i>
              <p>Belum ada rekening pada kategori ini.</p>
              <button type="button" class="btn btn-primary btn-sm" id="simpanan-empty-apply">Buka Produk Baru</button>
            </div>`
      }
    </div>
  `;
}

function renderCatalogTab(): string {
  return `
    <div class="catalog-grid">
      <article class="catalog-card is-featured">
        <div class="catalog-card-head">
          <span class="tile-icon-badge is-lime"><i data-lucide="wallet" width="20" height="20"></i></span>
          <span class="pill-badge badge-lime">Bunga 3.50% p.a.</span>
        </div>
        <h3>Tabungan Lentera</h3>
        <p class="catalog-desc">Simpanan harian fleksibel untuk transaksi sehari-hari dengan kartu debit virtual instan.</p>
        <ul class="spec-list">
          <li><span>Setoran Awal Min.</span><strong>Rp 50.000</strong></li>
          <li><span>Saldo Minimum</span><strong>Rp 20.000</strong></li>
          <li><span>Biaya Admin Bulanan</span><strong class="text-positive">Rp 0 (Gratis)</strong></li>
          <li><span>Fasilitas</span><strong>Kartu Virtual & Mutasi</strong></li>
        </ul>
        <button type="button" class="btn btn-primary w-full" data-apply-product="tabungan">
          Ajukan Tabungan <i data-lucide="arrow-right" width="16" height="16"></i>
        </button>
      </article>

      <article class="catalog-card">
        <div class="catalog-card-head">
          <span class="tile-icon-badge"><i data-lucide="trending-up" width="20" height="20"></i></span>
          <span class="pill-badge">s/d 4.75% p.a.</span>
        </div>
        <h3>Deposito Lentera Maxima</h3>
        <p class="catalog-desc">Simpanan berjangka dengan imbal hasil pasti, pilihan ARO fleksibel, dan e-Bilyet resmi.</p>
        <ul class="spec-list">
          <li><span>Min. Penempatan</span><strong>Rp 1.000.000</strong></li>
          <li><span>Pilihan Tenor</span><strong>1, 3, 6, 12 Bulan</strong></li>
          <li><span>Suku Bunga</span><strong>3.50% – 4.75% p.a.</strong></li>
          <li><span>Jatuh Tempo</span><strong>ARO / ARO+ / Non-ARO</strong></li>
        </ul>
        <button type="button" class="btn btn-tertiary w-full" data-apply-product="deposito">
          Ajukan Deposito <i data-lucide="arrow-right" width="16" height="16"></i>
        </button>
      </article>

      <article class="catalog-card">
        <div class="catalog-card-head">
          <span class="tile-icon-badge"><i data-lucide="building-2" width="20" height="20"></i></span>
          <span class="pill-badge">Jasa 1.50% p.a.</span>
        </div>
        <h3>Giro Lentera Niaga</h3>
        <p class="catalog-desc">Rekening transaksi bisnis untuk perorangan usaha maupun PT/CV dengan fasilitas Cek & Bilyet Giro.</p>
        <ul class="spec-list">
          <li><span>Setoran Awal Min.</span><strong>Rp 1.000.000</strong></li>
          <li><span>Biaya Admin</span><strong>Rp 25.000 / Bulan</strong></li>
          <li><span>Persyaratan</span><strong>KTP, NPWP, NIB/Usaha</strong></li>
          <li><span>Media Penarikan</span><strong>Cek, Bilyet Giro, Digital</strong></li>
        </ul>
        <button type="button" class="btn btn-tertiary w-full" data-apply-product="giro">
          Ajukan Giro Niaga <i data-lucide="arrow-right" width="16" height="16"></i>
        </button>
      </article>
    </div>
  `;
}

function renderCalculatorTab(): string {
  const result = calculateDepositYield(calcAmount, calcTenor);

  return `
    <div class="surface-plate calc-plate">
      <div class="form-group">
        <label for="sim-calc-amount">Nominal Penempatan Deposito</label>
        <div class="input-currency-wrap">
          <span class="currency-prefix">Rp</span>
          <input type="number" id="sim-calc-amount" class="input-control" min="1000000" step="500000" value="${calcAmount}" />
        </div>
        <input type="range" id="sim-calc-range" class="range-slider" min="1000000" max="100000000" step="1000000" value="${Math.min(100_000_000, Math.max(1_000_000, calcAmount))}" />
        <div class="range-labels">
          <span>Rp 1 Jt</span>
          <span>Rp 50 Jt</span>
          <span>Rp 100 Jt</span>
        </div>
      </div>

      <div class="form-group">
        <label>Pilih Tenor Penempatan</label>
        <div class="tenor-grid">
          ${PRODUCT_RULES.deposit.tenors
            .map(
              (t) => `
              <button type="button" class="tenor-btn ${calcTenor === t.months ? 'active' : ''}" data-sim-tenor="${t.months}">
                ${t.label}<small>${t.ratePa.toFixed(2)}% p.a.</small>
              </button>
            `
            )
            .join('')}
        </div>
      </div>

      <div class="calc-result-panel">
        <div class="calc-result-row"><span>Suku Bunga Efektif</span><strong id="sim-res-rate">${result.ratePa.toFixed(2)}% p.a.</strong></div>
        <div class="calc-result-row"><span>Bunga Kotor</span><strong id="sim-res-gross">${formatIDR(result.grossInterest)}</strong></div>
        <div class="calc-result-row"><span>Pajak Bunga (20%)</span><strong id="sim-res-tax">- ${formatIDR(result.taxAmount)}</strong></div>
        <div class="calc-result-row"><span>Bunga Bersih</span><strong id="sim-res-net" class="text-positive">+ ${formatIDR(result.netInterest)}</strong></div>
        <hr class="calc-divider" />
        <div class="calc-total-bar">
          <div>
            <small>Estimasi Total Jatuh Tempo</small>
            <div class="calc-total-value" id="sim-res-total">${formatIDR(result.maturityTotal)}</div>
          </div>
          <button type="button" class="btn btn-primary" id="sim-calc-apply">
            Lanjut Ajukan Deposito <i data-lucide="arrow-right" width="16" height="16"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Tanggung jawab tunggal: Merender layar Simpanan (Funding Hub)
 * beserta 3 sub-tab: Rekening Saya, Katalog Produk, dan Kalkulator Deposito.
 */
export function renderSimpananScreen(container: HTMLElement, params?: RouteParams): void {
  let currentSubTab: SimpananSubTab = params?.simpananTab ?? 'accounts';

  const draw = (): void => {
    container.innerHTML = `
      <div class="screen-stack">
        <div class="segmented-bar" role="tablist">
          <button type="button" class="seg-btn ${currentSubTab === 'accounts' ? 'active' : ''}" data-sim-tab="accounts">
            <i data-lucide="wallet" width="16" height="16"></i> Rekening Saya
          </button>
          <button type="button" class="seg-btn ${currentSubTab === 'catalog' ? 'active' : ''}" data-sim-tab="catalog">
            <i data-lucide="layers" width="16" height="16"></i> Katalog
          </button>
          <button type="button" class="seg-btn ${currentSubTab === 'calculator' ? 'active' : ''}" data-sim-tab="calculator">
            <i data-lucide="calculator" width="16" height="16"></i> Kalkulator
          </button>
        </div>

        <div id="simpanan-sub-content">
          ${
            currentSubTab === 'accounts'
              ? renderAccountsTab()
              : currentSubTab === 'catalog'
                ? renderCatalogTab()
                : renderCalculatorTab()
          }
        </div>
      </div>
    `;

    // Sub-tab switchers
    container.querySelectorAll<HTMLButtonElement>('[data-sim-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentSubTab = btn.dataset.simTab as SimpananSubTab;
        draw();
      });
    });

    // Accounts tab bindings
    container.querySelectorAll<HTMLButtonElement>('[data-acc-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeAccountFilter = btn.dataset.accFilter as 'all' | ProductKind;
        draw();
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-detail-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const accountId = btn.dataset.detailId;
        if (accountId) routerService.navigate('account-detail', { accountId });
      });
    });

    document.getElementById('simpanan-empty-apply')?.addEventListener('click', () => {
      currentSubTab = 'catalog';
      draw();
    });

    // Catalog tab bindings
    container.querySelectorAll<HTMLButtonElement>('[data-apply-product]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = btn.dataset.applyProduct as ProductKind;
        routerService.navigate('apply', { product });
      });
    });

    // Calculator tab bindings
    const amountInput = document.getElementById('sim-calc-amount') as HTMLInputElement | null;
    const rangeInput = document.getElementById('sim-calc-range') as HTMLInputElement | null;

    const refreshCalcNumbers = (): void => {
      const res = calculateDepositYield(calcAmount, calcTenor);
      const setTxt = (id: string, val: string): void => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setTxt('sim-res-rate', `${res.ratePa.toFixed(2)}% p.a.`);
      setTxt('sim-res-gross', formatIDR(res.grossInterest));
      setTxt('sim-res-tax', `- ${formatIDR(res.taxAmount)}`);
      setTxt('sim-res-net', `+ ${formatIDR(res.netInterest)}`);
      setTxt('sim-res-total', formatIDR(res.maturityTotal));
    };

    amountInput?.addEventListener('input', () => {
      calcAmount = Number(amountInput.value) || 0;
      if (rangeInput) {
        rangeInput.value = String(Math.min(100_000_000, Math.max(1_000_000, calcAmount)));
      }
      refreshCalcNumbers();
    });

    rangeInput?.addEventListener('input', () => {
      calcAmount = Number(rangeInput.value);
      if (amountInput) amountInput.value = String(calcAmount);
      refreshCalcNumbers();
    });

    container.querySelectorAll<HTMLButtonElement>('[data-sim-tenor]').forEach((btn) => {
      btn.addEventListener('click', () => {
        calcTenor = Number(btn.dataset.simTenor);
        container
          .querySelectorAll('[data-sim-tenor]')
          .forEach((el) => el.classList.toggle('active', el === btn));
        refreshCalcNumbers();
      });
    });

    document.getElementById('sim-calc-apply')?.addEventListener('click', () => {
      routerService.navigate('apply', {
        product: 'deposito',
        prefillAmount: Math.max(PRODUCT_RULES.deposit.minPlacement, calcAmount),
        prefillTenor: calcTenor,
      });
    });

    renderLucideIcons();
  };

  draw();
}
