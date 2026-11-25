import { LOAN_RULES } from '../config/product-rules.ts';
import { accountService } from '../services/account.service.ts';
import { calculateLoanInstallment } from '../services/calculator.service.ts';
import { bindCurrencyInputs, formatIDR, parseCurrencyValue, setCurrencyInputValue } from '../services/format.service.ts';
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
let indIncome = 8_500_000;
let umkmRevenue = 25_000_000;
let umkmYears = 2;

function renderLoansTab(): string {
  const loans = loanService.getLoans();
  const accounts = accountService.getTransactableAccounts();

  if (loans.length === 0) {
    return `
      <div class="surface-plate">
        <div class="empty-inline">
          <i data-lucide="landmark" width="32" height="32"></i>
          <p>Anda belum memiliki fasilitas kredit aktif. Pilih segmen <strong>Kredit Individu</strong> atau <strong>Kredit UMKM</strong> untuk mengajukan pembiayaan.</p>
          <button type="button" class="btn btn-primary btn-sm" id="kredit-go-apply">
            <i data-lucide="plus" width="15" height="15"></i>
            Ajukan Kredit Sekarang
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="catalog-grid two-col">
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
              <p class="catalog-desc">${loan.contractNumber} • ${loan.applicantSummary ?? ''}</p>

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
                <li><span>Rekening Pencairan</span><strong>${loan.disbursementAccountNumber}</strong></li>
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

function renderSegmentSelectorCards(): string {
  const segments: readonly LoanKind[] = ['konsumtif', 'umkm'];
  return `
    <div class="catalog-grid two-col">
      ${segments
        .map((kind) => {
          const r = LOAN_RULES[kind];
          const isSelected = selectedKind === kind;
          return `
            <button type="button" class="segment-compare-card ${isSelected ? 'active' : ''}" data-loan-kind="${kind}">
              <div class="catalog-card-head">
                <span class="tile-icon-badge ${isSelected ? 'is-lime' : ''}">
                  <i data-lucide="${kind === 'umkm' ? 'store' : 'user-check'}" width="20" height="20"></i>
                </span>
                <span class="pill-badge ${isSelected ? 'badge-lime' : ''}">${r.segmentLabel}</span>
              </div>
              <h3>${r.productName}</h3>
              <p class="catalog-desc">Plafon ${formatIDR(r.minAmount)} – ${formatIDR(r.maxAmount)} • Mulai ${r.tenors[0].monthlyRatePercent.toFixed(2)}% / bln</p>
              <ul class="segment-req-list">
                ${r.requirements.map((req) => `<li><i data-lucide="check" width="13" height="13"></i> ${req}</li>`).join('')}
              </ul>
            </button>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderSegmentSpecificFields(): string {
  if (selectedKind === 'umkm') {
    return `
      <div class="form-group">
        <label for="kr-biz-name">Nama Usaha / Toko / CV <span class="required-mark">*</span></label>
        <input type="text" id="kr-biz-name" class="input-control" placeholder="Contoh: Kedai Kopi Lentera" value="Warung Kuliner Sejahtera" required />
      </div>
      <div class="form-group">
        <label for="kr-biz-sector">Bidang Usaha <span class="required-mark">*</span></label>
        <select id="kr-biz-sector" class="input-control" required>
          <option value="Kuliner & F&B">Kuliner & F&B</option>
          <option value="Perdagangan / Ritel">Perdagangan / Ritel</option>
          <option value="Jasa & Layanan">Jasa & Layanan</option>
          <option value="Produksi / Kerajinan">Produksi / Kerajinan</option>
        </select>
      </div>
      <div class="form-group">
        <label for="kr-biz-revenue">Omzet Usaha / Bulan <span class="required-mark">*</span></label>
        <div class="input-currency-wrap">
          <span class="currency-prefix">Rp</span>
          <input type="text" inputmode="numeric" data-currency-input id="kr-biz-revenue" class="input-control" value="${umkmRevenue}" required />
        </div>
      </div>
      <div class="form-group">
        <label for="kr-biz-years">Lama Usaha Berjalan (Tahun) <span class="required-mark">*</span></label>
        <input type="number" id="kr-biz-years" class="input-control" min="0" max="50" step="1" value="${umkmYears}" required />
      </div>
      <div class="form-group full-width">
        <label for="kr-biz-nib">Nomor NIB / Surat Keterangan Usaha <span class="required-mark">*</span></label>
        <input type="text" id="kr-biz-nib" class="input-control" placeholder="Contoh: 1209230048112" value="1209230048112" required />
      </div>
    `;
  }

  return `
    <div class="form-group">
      <label for="kr-ind-job">Status Pekerjaan <span class="required-mark">*</span></label>
      <select id="kr-ind-job" class="input-control" required>
        <option value="Karyawan Swasta">Karyawan Swasta</option>
        <option value="ASN / Pegawai BUMN">ASN / Pegawai BUMN</option>
        <option value="Profesional / Freelancer">Profesional / Freelancer</option>
      </select>
    </div>
    <div class="form-group">
      <label for="kr-ind-income">Penghasilan Bersih / Bulan <span class="required-mark">*</span></label>
      <div class="input-currency-wrap">
        <span class="currency-prefix">Rp</span>
        <input type="text" inputmode="numeric" data-currency-input id="kr-ind-income" class="input-control" value="${indIncome}" required />
      </div>
    </div>
  `;
}

function renderApplyTab(): string {
  const rule = LOAN_RULES[selectedKind];
  const accounts = accountService.getTransactableAccounts();
  const clampedAmount = Math.min(rule.maxAmount, Math.max(rule.minAmount, applyAmount));
  if (!rule.tenors.some((t) => t.months === applyTenor)) {
    applyTenor = rule.tenors[1]?.months ?? rule.tenors[0].months;
  }
  const sim = calculateLoanInstallment(selectedKind, clampedAmount, applyTenor);
  const elig = loanService.evaluateEligibility(
    {
      kind: selectedKind,
      monthlyIncome: indIncome,
      monthlyRevenue: umkmRevenue,
      businessYears: umkmYears,
    },
    sim.monthlyInstallment
  );

  return `
    ${renderSegmentSelectorCards()}

    <div class="surface-plate">
      <div class="pane-header">
        <div>
          <h3>Formulir ${rule.productName}</h3>
          <p>Segmen <strong>${rule.segmentLabel}</strong> • Dilengkapi evaluasi kelayakan DSR otomatis.</p>
        </div>
        <span class="pill-badge badge-lime" id="kr-live-rate-badge">Bunga ${sim.monthlyRatePercent.toFixed(2)}% / bln</span>
      </div>

      <form id="kredit-apply-form">
        <div class="form-grid">
          ${renderSegmentSpecificFields()}

          <div class="form-group">
            <label for="kr-amount">Plafon Pinjaman (${formatIDR(rule.minAmount)} – ${formatIDR(rule.maxAmount)})</label>
            <div class="input-currency-wrap">
              <span class="currency-prefix">Rp</span>
              <input type="text" inputmode="numeric" data-currency-input id="kr-amount" class="input-control" value="${clampedAmount}" required />
            </div>
          </div>

          <div class="form-group">
            <label for="kr-tenor">Tenor & Suku Bunga</label>
            <select id="kr-tenor" class="input-control" required>
              ${rule.tenors
                .map(
                  (t) =>
                    `<option value="${t.months}" ${t.months === applyTenor ? 'selected' : ''}>${t.months} Bulan — ${t.monthlyRatePercent.toFixed(2)}% / bln</option>`
                )
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
            <input type="text" id="kr-purpose" class="input-control" placeholder="${selectedKind === 'umkm' ? 'Tambah stok & ekspansi usaha' : 'Renovasi rumah / pendidikan'}" required />
          </div>
        </div>

        <div class="calc-result-panel" style="margin: 16px 0;">
          <div class="calc-result-row">
            <span>Estimasi Cicilan / Bulan</span>
            <strong id="kr-live-installment">${formatIDR(sim.monthlyInstallment)}</strong>
          </div>
          <div class="calc-result-row">
            <span>Rasio Cicilan (DSR)</span>
            <strong id="kr-live-dsr" class="${elig.eligible ? 'text-positive' : 'text-negative'}">${elig.dsrPercent}% / maks ${elig.maxDsrPercent}%</strong>
          </div>
          <hr class="calc-divider" />
          <div class="calc-result-row">
            <span>Dana Cair ke Rekening</span>
            <strong id="kr-live-net" class="text-positive">${formatIDR(sim.netDisbursement)}</strong>
          </div>
        </div>

        <div id="kr-live-elig-banner" class="elig-banner ${elig.eligible ? 'is-ok' : 'is-fail'}">
          <i data-lucide="${elig.eligible ? 'check-circle-2' : 'alert-triangle'}" width="16" height="16"></i>
          <span>${elig.reason}</span>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full" ${accounts.length === 0 ? 'disabled' : ''}>
          <i data-lucide="check-circle-2" width="18" height="18"></i>
          Ajukan & Evaluasi Kelayakan Kredit
        </button>
      </form>
    </div>
  `;
}

function renderSimulatorTab(): string {
  const rule = LOAN_RULES[simKind];
  const clamped = Math.min(rule.maxAmount, Math.max(rule.minAmount, simAmount));
  if (!rule.tenors.some((t) => t.months === simTenor)) {
    simTenor = rule.tenors[1]?.months ?? rule.tenors[0].months;
  }
  const sim = calculateLoanInstallment(simKind, clamped, simTenor);

  return `
    <div class="surface-plate calc-plate">
      <div class="filter-chip-row">
        <button type="button" class="filter-chip ${simKind === 'konsumtif' ? 'active' : ''}" data-sim-kind="konsumtif">
          Individu / Konsumtif (Mulai ${LOAN_RULES.konsumtif.tenors[0].monthlyRatePercent.toFixed(2)}%/bln)
        </button>
        <button type="button" class="filter-chip ${simKind === 'umkm' ? 'active' : ''}" data-sim-kind="umkm">
          UMKM / Modal Kerja (Mulai ${LOAN_RULES.umkm.tenors[0].monthlyRatePercent.toFixed(2)}%/bln)
        </button>
      </div>

      <div class="form-group">
        <label for="kr-sim-amount">Nominal Pinjaman</label>
        <div class="input-currency-wrap">
          <span class="currency-prefix">Rp</span>
          <input type="text" inputmode="numeric" data-currency-input id="kr-sim-amount" class="input-control" value="${clamped}" />
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
        <div class="tenor-grid">
          ${rule.tenors
            .map(
              (t) => `
              <button type="button" class="tenor-btn ${t.months === simTenor ? 'active' : ''}" data-sim-tenor="${t.months}">
                ${t.months} Bulan
                <small>${t.monthlyRatePercent.toFixed(2)}% / bln</small>
              </button>
            `
            )
            .join('')}
        </div>
      </div>

      <div class="calc-result-panel">
        <div class="calc-result-row"><span>Pokok / Bulan</span><strong id="sim-loan-principal">${formatIDR(sim.monthlyPrincipal)}</strong></div>
        <div class="calc-result-row"><span>Bunga / Bulan</span><strong id="sim-loan-interest">${formatIDR(sim.monthlyInterest)}</strong></div>
        <div class="calc-result-row"><span>Dana Cair Bersih</span><strong id="sim-loan-net" class="text-positive">${formatIDR(sim.netDisbursement)}</strong></div>
        <hr class="calc-divider" />
        <div class="calc-total-bar">
          <div>
            <small>Estimasi Cicilan per Bulan</small>
            <div class="calc-total-value" id="sim-loan-monthly">${formatIDR(sim.monthlyInstallment)}</div>
          </div>
          <button type="button" class="btn btn-primary" id="kr-sim-apply-btn">
            Ajukan Sekarang <i data-lucide="arrow-right" width="16" height="16"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Tanggung jawab tunggal: Merender layar Kredit & Pembiayaan (Tahap 2)
 * dengan pemisahan layanan Kredit Individu vs Kredit UMKM serta evaluasi DSR.
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
        <div class="segmented-bar" role="tablist">
          <button type="button" class="seg-btn ${activeTab === 'loans' ? 'active' : ''}" data-kr-tab="loans">
            <i data-lucide="landmark" width="16" height="16"></i> Pinjaman (${loanService.getLoans().length})
          </button>
          <button type="button" class="seg-btn ${activeTab === 'apply' ? 'active' : ''}" data-kr-tab="apply">
            <i data-lucide="plus-circle" width="16" height="16"></i> Ajukan Kredit
          </button>
          <button type="button" class="seg-btn ${activeTab === 'simulator' ? 'active' : ''}" data-kr-tab="simulator">
            <i data-lucide="calculator" width="16" height="16"></i> Simulasi
          </button>
        </div>

        ${bodyHtml}
      </div>
    `;

    bindEvents(draw);
    bindCurrencyInputs(container);
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
    const krIndIncomeEl = document.getElementById('kr-ind-income') as HTMLInputElement | null;
    const krBizRevEl = document.getElementById('kr-biz-revenue') as HTMLInputElement | null;
    const krBizYearsEl = document.getElementById('kr-biz-years') as HTMLInputElement | null;

    const refreshApplyPreview = (): void => {
      if (!krAmountEl || !krTenorEl) return;
      applyAmount = parseCurrencyValue(krAmountEl.value) || LOAN_RULES[selectedKind].minAmount;
      applyTenor = Number(krTenorEl.value) || 12;
      if (krIndIncomeEl) indIncome = parseCurrencyValue(krIndIncomeEl.value);
      if (krBizRevEl) umkmRevenue = parseCurrencyValue(krBizRevEl.value);
      if (krBizYearsEl) umkmYears = Number(krBizYearsEl.value) || 0;

      const sim = calculateLoanInstallment(selectedKind, applyAmount, applyTenor);
      const elig = loanService.evaluateEligibility(
        {
          kind: selectedKind,
          monthlyIncome: indIncome,
          monthlyRevenue: umkmRevenue,
          businessYears: umkmYears,
        },
        sim.monthlyInstallment
      );

      const instEl = document.getElementById('kr-live-installment');
      const dsrEl = document.getElementById('kr-live-dsr');
      const netEl = document.getElementById('kr-live-net');
      const rateBadgeEl = document.getElementById('kr-live-rate-badge');
      const bannerEl = document.getElementById('kr-live-elig-banner');

      if (instEl) instEl.textContent = formatIDR(sim.monthlyInstallment);
      if (rateBadgeEl) rateBadgeEl.textContent = `Bunga ${sim.monthlyRatePercent.toFixed(2)}% / bln`;
      if (dsrEl) {
        dsrEl.textContent = `${elig.dsrPercent}% / maks ${elig.maxDsrPercent}%`;
        dsrEl.className = elig.eligible ? 'text-positive' : 'text-negative';
      }
      if (netEl) netEl.textContent = formatIDR(sim.netDisbursement);
      if (bannerEl) {
        bannerEl.className = `elig-banner ${elig.eligible ? 'is-ok' : 'is-fail'}`;
        bannerEl.innerHTML = `<i data-lucide="${elig.eligible ? 'check-circle-2' : 'alert-triangle'}" width="16" height="16"></i><span>${elig.reason}</span>`;
        renderLucideIcons();
      }
    };

    krAmountEl?.addEventListener('input', refreshApplyPreview);
    krTenorEl?.addEventListener('change', refreshApplyPreview);
    krIndIncomeEl?.addEventListener('input', refreshApplyPreview);
    krBizRevEl?.addEventListener('input', refreshApplyPreview);
    krBizYearsEl?.addEventListener('input', refreshApplyPreview);

    document.getElementById('kredit-apply-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = parseCurrencyValue(krAmountEl?.value ?? '');
      const tenor = Number(krTenorEl?.value) || 12;
      const accountId = (document.getElementById('kr-account') as HTMLSelectElement | null)?.value ?? '';
      const purpose = (document.getElementById('kr-purpose') as HTMLInputElement | null)?.value ?? '';

      const res = loanService.applyLoan({
        kind: selectedKind,
        principal: amount,
        tenorMonths: tenor,
        purpose,
        disbursementAccountId: accountId,
        employmentStatus: (document.getElementById('kr-ind-job') as HTMLSelectElement | null)?.value,
        monthlyIncome: krIndIncomeEl ? parseCurrencyValue(krIndIncomeEl.value) : indIncome,
        businessName: (document.getElementById('kr-biz-name') as HTMLInputElement | null)?.value,
        businessSector: (document.getElementById('kr-biz-sector') as HTMLSelectElement | null)?.value,
        businessYears: Number(krBizYearsEl?.value) ?? umkmYears,
        monthlyRevenue: krBizRevEl ? parseCurrencyValue(krBizRevEl.value) : umkmRevenue,
        nibNumber: (document.getElementById('kr-biz-nib') as HTMLInputElement | null)?.value,
      });

      if (!res.ok) {
        modalController.show({
          badge: 'Evaluasi Kelayakan Ditolak',
          title: 'Pengajuan Belum Memenuhi Syarat',
          subtitle: res.error,
          rows: res.eligibility
            ? [
                { label: 'Rasio DSR Anda', value: `${res.eligibility.dsrPercent}%` },
                { label: 'Batas Maksimal DSR', value: `${res.eligibility.maxDsrPercent}%` },
                { label: 'Maks. Cicilan Layak', value: formatIDR(res.eligibility.maxAllowedInstallment), highlight: true },
              ]
            : [],
          ctaLabel: 'Sesuaikan Pengajuan',
        });
        return;
      }

      modalController.show({
        badge: 'Kredit Disetujui & Cair',
        title: `${res.loan.productName} Aktif`,
        subtitle: `Dana pencairan telah masuk ke rekening ${res.loan.disbursementAccountNumber}.`,
        rows: [
          { label: 'Nomor Kontrak', value: res.loan.contractNumber },
          { label: 'Profil Pemohon', value: res.loan.applicantSummary },
          { label: 'Skor DSR', value: `${res.eligibility.dsrPercent}% (Layak ≤ ${res.eligibility.maxDsrPercent}%)` },
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
      simAmount = parseCurrencyValue(simAmountEl.value) || LOAN_RULES[simKind].minAmount;
      if (simRangeEl) simRangeEl.value = String(simAmount);
      refreshSimStats();
    });

    simRangeEl?.addEventListener('input', () => {
      simAmount = Number(simRangeEl.value) || LOAN_RULES[simKind].minAmount;
      setCurrencyInputValue(simAmountEl, simAmount);
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
