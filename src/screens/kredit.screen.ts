import { LOAN_RULES } from '../config/product-rules.ts';
import { accountService } from '../services/account.service.ts';
import { calculateLoanInstallment } from '../services/calculator.service.ts';
import { formatIDR } from '../services/format.service.ts';
import { loanService } from '../services/loan.service.ts';
import type { ActiveLoan, LoanKind } from '../types/loan.ts';
import { renderLucideIcons } from '../ui/icons.ts';
import { modalController } from '../ui/modal.controller.ts';

type KreditSubTab = 'loans' | 'apply' | 'simulator';

let activeTab: KreditSubTab = 'loans';
let selectedKind: LoanKind = 'konsumtif';
let simKind: LoanKind = 'konsumtif';
let simAmount = 25_000_000;
let simTenor = 12;
let applyAmount = 25_000_000;
let applyTenor = 12;

function renderLoansTab(): string {
  const loans = loanService.getLoans();
  const accounts = accountService.getTransactableAccounts();

  if (loans.length === 0) {
    return `
      <div class="surface-plate">
        <div class="empty-inline">
          <i data-lucide="landmark" width="32" height="32"></i>
          <p>Anda belum memiliki fasilitas kredit aktif. Ajukan Kredit Konsumtif atau UMKM dan dana cair instan ke rekening Tabungan Anda.</p>
          <button type="button" class="btn btn-primary btn-sm" id="kredit-go-apply">
            <i data-lucide="plus" width="15" height="15"></i>
            Ajukan Kredit Sekarang
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="catalog-grid">
      ${loans
        .map((loan: ActiveLoan) => {
          const pct = Math.min(100, Math.round((loan.paidInstallments / loan.tenorMonths) * 100));
          const isLunas = loan.status === 'LUNAS';
          return `
            <article class="catalog-card ${isLunas ? '' : 'is-featured'}">
              <div class="catalog-card-head">
                <span class="tile-icon-badge ${isLunas ? '' : 'is-lime'}">
                  <i data-lucide="${loan.kind === 'umkm' ? 'building-2' : 'credit-card'}" width="20" height="20"></i>
                </span>
                <span class="pill-badge ${isLunas ? 'badge-lime' : ''}">
                  ${isLunas ? 'LUNAS' : `Cicilan ${loan.paidInstallments}/${loan.tenorMonths}`}
                </span>
              </div>
              <h3>${loan.productName}</h3>
              <p class="catalog-desc">${loan.contractNumber} • Cair ke ${loan.disbursementAccountNumber}</p>

              <div class="loan-progress-wrap">
                <div class="loan-progress-bar">
                  <div class="loan-progress-fill" style="width: ${pct}%"></div>
                </div>
                <span class="loan-progress-label">${pct}% Terbayar</span>
              </div>

              <ul class="spec-list">
                <li><span>Plafon Awal</span><strong>${formatIDR(loan.principal)}</strong></li>
                <li><span>Angsuran / Bulan</span><strong>${formatIDR(loan.monthlyInstallment)}</strong></li>
                <li><span>Sisa Kewajiban</span><strong class="${isLunas ? 'text-positive' : ''}">${formatIDR(loan.remainingBalance)}</strong></li>
              </ul>

              ${
                isLunas
                  ? `<div class="pill-badge badge-lime" style="justify-content:center; width:100%; padding:10px;">Fasilitas Kredit Lunas</div>`
                  : `<div class="loan-pay-box">
                      <label class="loan-pay-label" for="pay-src-${loan.id}">Rekening Pembayar</label>
                      <select id="pay-src-${loan.id}" class="input-control" data-loan-source="${loan.id}">
                        ${accounts
                          .map(
                            (acc) =>
                              `<option value="${acc.id}">${acc.productKind === 'tabungan' ? 'Tabungan' : 'Giro'} (${acc.accountNumber}) — ${formatIDR(acc.balance)}</option>`
                          )
                          .join('')}
                      </select>
                      <button type="button" class="btn btn-primary w-full" data-pay-loan="${loan.id}">
                        <i data-lucide="check-circle-2" width="16" height="16"></i>
                        Bayar Cicilan (${formatIDR(loan.monthlyInstallment)})
                      </button>
                    </div>`
              }
            </article>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderApplyTab(): string {
  const rule = LOAN_RULES[selectedKind];
  const accounts = accountService.getTransactableAccounts();
  const clampedAmount = Math.min(rule.maxAmount, Math.max(rule.minAmount, applyAmount));
  if (!rule.tenors.includes(applyTenor as never)) {
    applyTenor = rule.tenors[1] ?? rule.tenors[0];
  }
  const sim = calculateLoanInstallment(selectedKind, clampedAmount, applyTenor);

  return `
    <div class="surface-plate">
      <div class="pane-header">
        <div>
          <h3>Pengajuan Kredit LENTERA</h3>
          <p>Pilih jenis kredit, plafon, dan rekening tujuan pencairan dana.</p>
        </div>
        <span class="pill-badge badge-lime">Bunga ${rule.monthlyRatePercent}% / bln</span>
      </div>

      <div class="filter-chip-row" style="margin-bottom: 16px;">
        <button type="button" class="filter-chip ${selectedKind === 'konsumtif' ? 'active' : ''}" data-loan-kind="konsumtif">
          Kredit Konsumtif (s/d 200 Jt)
        </button>
        <button type="button" class="filter-chip ${selectedKind === 'umkm' ? 'active' : ''}" data-loan-kind="umkm">
          Kredit UMKM (s/d 500 Jt)
        </button>
      </div>

      <form id="kredit-apply-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="kr-amount">Plafon Pinjaman (${formatIDR(rule.minAmount)} – ${formatIDR(rule.maxAmount)})</label>
            <div class="input-currency-wrap">
              <span class="currency-prefix">Rp</span>
              <input type="number" id="kr-amount" class="input-control" min="${rule.minAmount}" max="${rule.maxAmount}" step="1000000" value="${clampedAmount}" required />
            </div>
          </div>

          <div class="form-group">
            <label for="kr-tenor">Tenor Angsuran</label>
            <select id="kr-tenor" class="input-control" required>
              ${rule.tenors
                .map((m) => `<option value="${m}" ${m === applyTenor ? 'selected' : ''}>${m} Bulan</option>`)
                .join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="kr-account">Rekening Tujuan Pencairan</label>
            <select id="kr-account" class="input-control" required>
              ${accounts
                .map(
                  (acc) =>
                    `<option value="${acc.id}">${acc.productKind === 'tabungan' ? 'Tabungan' : 'Giro'} (${acc.accountNumber}) — ${formatIDR(acc.balance)}</option>`
                )
                .join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="kr-purpose">Tujuan Pembiayaan</label>
            <input type="text" id="kr-purpose" class="input-control" placeholder="${selectedKind === 'umkm' ? 'Modal kerja & ekspansi usaha' : 'Renovasi rumah / pendidikan'}" required />
          </div>
        </div>

        <div class="calc-result-grid" style="margin: 16px 0;">
          <div class="calc-stat-box is-highlight">
            <span>Estimasi Cicilan / Bulan</span>
            <strong id="kr-live-installment">${formatIDR(sim.monthlyInstallment)}</strong>
          </div>
          <div class="calc-stat-box">
            <span>Biaya Provisi (${rule.provisionPercent}%)</span>
            <strong id="kr-live-provision">${formatIDR(sim.provisionFee)}</strong>
          </div>
          <div class="calc-stat-box">
            <span>Dana Cair ke Rekening</span>
            <strong id="kr-live-net" class="text-positive">${formatIDR(sim.netDisbursement)}</strong>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full" ${accounts.length === 0 ? 'disabled' : ''}>
          <i data-lucide="check-circle-2" width="18" height="18"></i>
          Ajukan & Cairkan Dana Sekarang
        </button>
      </form>
    </div>
  `;
}

function renderSimulatorTab(): string {
  const rule = LOAN_RULES[simKind];
  const clamped = Math.min(rule.maxAmount, Math.max(rule.minAmount, simAmount));
  if (!rule.tenors.includes(simTenor as never)) {
    simTenor = rule.tenors[1] ?? rule.tenors[0];
  }
  const sim = calculateLoanInstallment(simKind, clamped, simTenor);

  return `
    <div class="surface-plate calc-plate">
      <div class="filter-chip-row">
        <button type="button" class="filter-chip ${simKind === 'konsumtif' ? 'active' : ''}" data-sim-kind="konsumtif">
          Konsumtif (${LOAN_RULES.konsumtif.monthlyRatePercent}%/bln)
        </button>
        <button type="button" class="filter-chip ${simKind === 'umkm' ? 'active' : ''}" data-sim-kind="umkm">
          UMKM (${LOAN_RULES.umkm.monthlyRatePercent}%/bln)
        </button>
      </div>

      <div class="form-group">
        <label for="kr-sim-amount">Nominal Pinjaman</label>
        <div class="input-currency-wrap">
          <span class="currency-prefix">Rp</span>
          <input type="number" id="kr-sim-amount" class="input-control" min="${rule.minAmount}" max="${rule.maxAmount}" step="1000000" value="${clamped}" />
        </div>
        <input type="range" id="kr-sim-range" class="range-slider" min="${rule.minAmount}" max="${rule.maxAmount}" step="1000000" value="${clamped}" />
        <div class="range-labels">
          <span>${formatIDR(rule.minAmount)}</span>
          <span>${formatIDR(Math.round(rule.maxAmount / 2))}</span>
          <span>${formatIDR(rule.maxAmount)}</span>
        </div>
      </div>

      <div class="form-group">
        <label>Pilih Tenor Angsuran</label>
        <div class="tenor-pill-row">
          ${rule.tenors
            .map(
              (m) => `
              <button type="button" class="tenor-pill ${m === simTenor ? 'active' : ''}" data-sim-tenor="${m}">
                <strong>${m} Bln</strong>
                <span>${rule.monthlyRatePercent}%/bln</span>
              </button>
            `
            )
            .join('')}
        </div>
      </div>

      <div class="calc-result-grid">
        <div class="calc-stat-box is-highlight">
          <span>Cicilan per Bulan</span>
          <strong id="sim-loan-monthly">${formatIDR(sim.monthlyInstallment)}</strong>
        </div>
        <div class="calc-stat-box">
          <span>Pokok / Bulan</span>
          <strong id="sim-loan-principal">${formatIDR(sim.monthlyPrincipal)}</strong>
        </div>
        <div class="calc-stat-box">
          <span>Bunga / Bulan</span>
          <strong id="sim-loan-interest">${formatIDR(sim.monthlyInterest)}</strong>
        </div>
        <div class="calc-stat-box">
          <span>Dana Cair Bersih</span>
          <strong id="sim-loan-net" class="text-positive">${formatIDR(sim.netDisbursement)}</strong>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-lg w-full" id="kr-sim-apply-btn">
        Ajukan dengan Nominal Ini <i data-lucide="arrow-right" width="16" height="16"></i>
      </button>
    </div>
  `;
}

/**
 * Tanggung jawab tunggal: Merender layar Kredit & Pembiayaan (Tahap 2)
 * dengan manajemen Pinjaman Aktif, Form Pengajuan & Pencairan, serta Simulasi Angsuran.
 */
export function renderKreditScreen(container: HTMLElement): void {
  const draw = (): void => {
    const bodyHtml =
      activeTab === 'loans'
        ? renderLoansTab()
        : activeTab === 'apply'
          ? renderApplyTab()
          : renderSimulatorTab();

    container.innerHTML = `
      <div class="screen-stack">
        <div class="sub-tabs-bar" role="tablist">
          <button type="button" class="sub-tab-btn ${activeTab === 'loans' ? 'active' : ''}" data-kr-tab="loans">
            Pinjaman Saya (${loanService.getLoans().length})
          </button>
          <button type="button" class="sub-tab-btn ${activeTab === 'apply' ? 'active' : ''}" data-kr-tab="apply">
            Ajukan Kredit
          </button>
          <button type="button" class="sub-tab-btn ${activeTab === 'simulator' ? 'active' : ''}" data-kr-tab="simulator">
            Simulasi Kredit
          </button>
        </div>

        ${bodyHtml}
      </div>
    `;

    bindEvents(draw);
    renderLucideIcons();
  };

  const bindEvents = (redraw: () => void): void => {
    container.querySelectorAll<HTMLButtonElement>('[data-kr-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.krTab as KreditSubTab;
        redraw();
      });
    });

    document.getElementById('kredit-go-apply')?.addEventListener('click', () => {
      activeTab = 'apply';
      redraw();
    });

    // Pay installment
    container.querySelectorAll<HTMLButtonElement>('[data-pay-loan]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const loanId = btn.dataset.payLoan;
        if (!loanId) return;
        const selectEl = container.querySelector<HTMLSelectElement>(`[data-loan-source="${loanId}"]`);
        const sourceId = selectEl?.value;
        if (!sourceId) return;

        const res = loanService.payInstallment(loanId, sourceId);
        if (!res.ok) {
          modalController.show({
            badge: 'Pembayaran Gagal',
            title: 'Saldo Tidak Mencukupi',
            subtitle: res.error,
            rows: [{ label: 'Saran', value: 'Pilih rekening lain atau tambah saldo Tabungan.' }],
            ctaLabel: 'Mengerti',
          });
          return;
        }

        modalController.show({
          badge: 'Angsuran Berhasil',
          title: res.loan.status === 'LUNAS' ? 'Selamat! Kredit Anda Lunas' : 'Pembayaran Cicilan Diterima',
          subtitle: `${res.loan.productName} (${res.loan.contractNumber})`,
          rows: [
            { label: 'Cicilan Dibayar', value: formatIDR(res.paidAmount), highlight: true },
            { label: 'Rekening Sumber', value: res.sourceAccountNumber },
            { label: 'Progres Tenor', value: `${res.loan.paidInstallments} / ${res.loan.tenorMonths} Bulan` },
            { label: 'Sisa Kewajiban', value: formatIDR(res.loan.remainingBalance) },
          ],
          ctaLabel: 'Selesai',
          onConfirm: () => redraw(),
        });
      });
    });

    // Apply form events
    container.querySelectorAll<HTMLButtonElement>('[data-loan-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedKind = btn.dataset.loanKind as LoanKind;
        redraw();
      });
    });

    const krAmountEl = document.getElementById('kr-amount') as HTMLInputElement | null;
    const krTenorEl = document.getElementById('kr-tenor') as HTMLSelectElement | null;

    const refreshApplyPreview = (): void => {
      if (!krAmountEl || !krTenorEl) return;
      applyAmount = Number(krAmountEl.value) || LOAN_RULES[selectedKind].minAmount;
      applyTenor = Number(krTenorEl.value) || 12;
      const sim = calculateLoanInstallment(selectedKind, applyAmount, applyTenor);
      const instEl = document.getElementById('kr-live-installment');
      const provEl = document.getElementById('kr-live-provision');
      const netEl = document.getElementById('kr-live-net');
      if (instEl) instEl.textContent = formatIDR(sim.monthlyInstallment);
      if (provEl) provEl.textContent = formatIDR(sim.provisionFee);
      if (netEl) netEl.textContent = formatIDR(sim.netDisbursement);
    };

    krAmountEl?.addEventListener('input', refreshApplyPreview);
    krTenorEl?.addEventListener('change', refreshApplyPreview);

    document.getElementById('kredit-apply-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = Number(krAmountEl?.value) || 0;
      const tenor = Number(krTenorEl?.value) || 12;
      const accountId = (document.getElementById('kr-account') as HTMLSelectElement | null)?.value ?? '';
      const purpose = (document.getElementById('kr-purpose') as HTMLInputElement | null)?.value ?? '';

      const res = loanService.applyLoan({
        kind: selectedKind,
        principal: amount,
        tenorMonths: tenor,
        purpose,
        disbursementAccountId: accountId,
      });

      if (!res.ok) {
        modalController.show({
          badge: 'Pengajuan Ditolak',
          title: 'Periksa Nominal Pengajuan',
          subtitle: res.error,
          rows: [],
          ctaLabel: 'Perbaiki',
        });
        return;
      }

      modalController.show({
        badge: 'Kredit Disetujui & Cair',
        title: `${res.loan.productName} Aktif`,
        subtitle: `Dana pencairan telah masuk ke rekening ${res.loan.disbursementAccountNumber}.`,
        rows: [
          { label: 'Nomor Kontrak', value: res.loan.contractNumber },
          { label: 'Plafon Disetujui', value: formatIDR(res.loan.principal) },
          { label: 'Biaya Provisi', value: formatIDR(res.simulation.provisionFee) },
          { label: 'Dana Cair ke Saldo', value: formatIDR(res.simulation.netDisbursement), highlight: true },
          { label: 'Angsuran / Bulan', value: `${formatIDR(res.loan.monthlyInstallment)} (${res.loan.tenorMonths}x)` },
        ],
        ctaLabel: 'Lihat Pinjaman Saya',
        onConfirm: () => {
          activeTab = 'loans';
          redraw();
        },
      });
    });

    // Simulator events
    container.querySelectorAll<HTMLButtonElement>('[data-sim-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        simKind = btn.dataset.simKind as LoanKind;
        redraw();
      });
    });

    const simAmountEl = document.getElementById('kr-sim-amount') as HTMLInputElement | null;
    const simRangeEl = document.getElementById('kr-sim-range') as HTMLInputElement | null;

    const refreshSimStats = (): void => {
      const s = calculateLoanInstallment(simKind, simAmount, simTenor);
      const mEl = document.getElementById('sim-loan-monthly');
      const pEl = document.getElementById('sim-loan-principal');
      const iEl = document.getElementById('sim-loan-interest');
      const nEl = document.getElementById('sim-loan-net');
      if (mEl) mEl.textContent = formatIDR(s.monthlyInstallment);
      if (pEl) pEl.textContent = formatIDR(s.monthlyPrincipal);
      if (iEl) iEl.textContent = formatIDR(s.monthlyInterest);
      if (nEl) nEl.textContent = formatIDR(s.netDisbursement);
    };

    simAmountEl?.addEventListener('input', () => {
      simAmount = Number(simAmountEl.value) || LOAN_RULES[simKind].minAmount;
      if (simRangeEl) simRangeEl.value = String(simAmount);
      refreshSimStats();
    });

    simRangeEl?.addEventListener('input', () => {
      simAmount = Number(simRangeEl.value) || LOAN_RULES[simKind].minAmount;
      if (simAmountEl) simAmountEl.value = String(simAmount);
      refreshSimStats();
    });

    container.querySelectorAll<HTMLButtonElement>('[data-sim-tenor]').forEach((btn) => {
      btn.addEventListener('click', () => {
        simTenor = Number(btn.dataset.simTenor) || 12;
        redraw();
      });
    });

    document.getElementById('kr-sim-apply-btn')?.addEventListener('click', () => {
      selectedKind = simKind;
      applyAmount = simAmount;
      applyTenor = simTenor;
      activeTab = 'apply';
      redraw();
    });
  };

  draw();
}
