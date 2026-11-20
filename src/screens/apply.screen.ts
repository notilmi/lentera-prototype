import { GIRO_FACILITY_LABELS, PRODUCT_RULES, ROLLOVER_LABELS } from '../config/product-rules.ts';
import { MOCK_CUSTOMER } from '../config/seed-data.ts';
import { accountService } from '../services/account.service.ts';
import { formatIDR } from '../services/format.service.ts';
import { ledgerService } from '../services/ledger.service.ts';
import { routerService } from '../services/router.service.ts';
import type {
  DepositRolloverMode,
  GiroApplicantCategory,
  GiroFacilityOption,
  ProductKind,
} from '../types/account.ts';
import type { RouteParams } from '../types/navigation.ts';
import { renderLucideIcons } from '../ui/icons.ts';
import { modalController } from '../ui/modal.controller.ts';

function renderTabunganForm(): string {
  return `
    <div class="pane-header">
      <div>
        <h3>Buka Tabungan Lentera</h3>
        <p>Penerbitan nomor rekening & kartu debit virtual instan tanpa biaya admin.</p>
      </div>
      <span class="pill-badge badge-lime">3.50% p.a. • Admin Rp 0</span>
    </div>
    <form id="app-form-tabungan">
      <div class="form-grid">
        <div class="form-group">
          <label for="tb-name">Nama Lengkap (Sesuai KTP) <span class="required-mark">*</span></label>
          <input type="text" id="tb-name" class="input-control" value="${MOCK_CUSTOMER.fullName}" required />
        </div>
        <div class="form-group">
          <label for="tb-nik">NIK (16 Digit) <span class="required-mark">*</span></label>
          <input type="text" id="tb-nik" class="input-control" value="${MOCK_CUSTOMER.nik}" maxlength="16" pattern="\\d{16}" required />
        </div>
        <div class="form-group">
          <label for="tb-phone">Nomor WhatsApp / HP <span class="required-mark">*</span></label>
          <input type="tel" id="tb-phone" class="input-control" value="${MOCK_CUSTOMER.phone}" required />
        </div>
        <div class="form-group">
          <label for="tb-email">Alamat Email <span class="required-mark">*</span></label>
          <input type="email" id="tb-email" class="input-control" value="${MOCK_CUSTOMER.email}" required />
        </div>
        <div class="form-group full-width">
          <label for="tb-deposit">Setoran Awal (Min. Rp 50.000) <span class="required-mark">*</span></label>
          <div class="input-currency-wrap">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="tb-deposit" class="input-control" min="50000" step="10000" value="500000" required />
          </div>
        </div>
      </div>
      <label class="checkbox-row">
        <input type="checkbox" required checked />
        <span>Saya menyetujui ketentuan pembukaan Tabungan Lentera (simulasi).</span>
      </label>
      <button type="submit" class="btn btn-primary btn-lg w-full">
        <i data-lucide="check-circle-2" width="18" height="18"></i>
        Buka Tabungan Sekarang
      </button>
    </form>
  `;
}

function renderDepositoForm(prefillAmount?: number, prefillTenor?: number): string {
  const amount = prefillAmount ?? 10_000_000;
  const tenor = prefillTenor ?? 6;

  return `
    <div class="pane-header">
      <div>
        <h3>Penempatan Deposito Maxima</h3>
        <p>Imbal hasil pasti hingga 6.00% p.a. dengan penerbitan e-Bilyet digital.</p>
      </div>
      <span class="pill-badge badge-lime">Min. Rp 1.000.000</span>
    </div>
    <form id="app-form-deposito">
      <div class="form-grid">
        <div class="form-group">
          <label for="dp-name">Nama Pemegang Deposito <span class="required-mark">*</span></label>
          <input type="text" id="dp-name" class="input-control" value="${MOCK_CUSTOMER.fullName}" required />
        </div>
        <div class="form-group">
          <label for="dp-source">Sumber Dana <span class="required-mark">*</span></label>
          <select id="dp-source" class="input-control" required>
            <option value="auto">Tabungan Lentera (Terhubung)</option>
            <option value="transfer">Transfer Bank Lain (Simulasi)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="dp-amount">Nominal Penempatan (Min. Rp 1.000.000) <span class="required-mark">*</span></label>
          <div class="input-currency-wrap">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="dp-amount" class="input-control" min="1000000" step="500000" value="${amount}" required />
          </div>
        </div>
        <div class="form-group">
          <label for="dp-tenor">Tenor & Suku Bunga <span class="required-mark">*</span></label>
          <select id="dp-tenor" class="input-control" required>
            ${PRODUCT_RULES.deposit.tenors
              .map(
                (t) =>
                  `<option value="${t.months}" ${t.months === tenor ? 'selected' : ''}>${t.label} — ${t.ratePa.toFixed(2)}% p.a.</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="form-group full-width">
          <label for="dp-aro">Instruksi Jatuh Tempo (Rollover) <span class="required-mark">*</span></label>
          <select id="dp-aro" class="input-control" required>
            <option value="ARO_POKOK">ARO Pokok — Bunga cair ke Tabungan</option>
            <option value="ARO_POKOK_BUNGA">ARO Pokok + Bunga (Majemuk)</option>
            <option value="NON_ARO">Non-ARO — Cair penuh saat jatuh tempo</option>
          </select>
        </div>
      </div>
      <label class="checkbox-row">
        <input type="checkbox" required checked />
        <span>Saya mengonfirmasi penempatan Deposito Berjangka sesuai tenor yang dipilih.</span>
      </label>
      <button type="submit" class="btn btn-primary btn-lg w-full">
        <i data-lucide="file-check-2" width="18" height="18"></i>
        Tempatkan Deposito & Terbitkan e-Bilyet
      </button>
    </form>
  `;
}

function renderGiroForm(): string {
  return `
    <div class="pane-header">
      <div>
        <h3>Pembukaan Giro Lentera Niaga</h3>
        <p>Rekening transaksi bisnis dengan fasilitas Buku Cek, Bilyet Giro & e-Statement.</p>
      </div>
      <span class="pill-badge badge-lime">Jasa Giro 1.50% p.a.</span>
    </div>
    <form id="app-form-giro">
      <div class="form-grid">
        <div class="form-group">
          <label for="gr-type">Segmen Nasabah <span class="required-mark">*</span></label>
          <select id="gr-type" class="input-control" required>
            <option value="perorangan">Perorangan Usaha</option>
            <option value="badan_usaha">Badan Usaha (PT / CV / Yayasan)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="gr-entity-name">Nama Usaha / Entitas <span class="required-mark">*</span></label>
          <input type="text" id="gr-entity-name" class="input-control" placeholder="Contoh: CV Lentera Mandiri" required />
        </div>
        <div class="form-group">
          <label for="gr-npwp">Nomor NPWP <span class="required-mark">*</span></label>
          <input type="text" id="gr-npwp" class="input-control" placeholder="01.234.567.8-901.000" required />
        </div>
        <div class="form-group">
          <label for="gr-nib">NIB / Bidang Usaha <span class="required-mark">*</span></label>
          <input type="text" id="gr-nib" class="input-control" placeholder="Perdagangan Retail & Jasa" required />
        </div>
        <div class="form-group">
          <label for="gr-deposit">Setoran Awal Giro (Min. Rp 1.000.000) <span class="required-mark">*</span></label>
          <div class="input-currency-wrap">
            <span class="currency-prefix">Rp</span>
            <input type="number" id="gr-deposit" class="input-control" min="1000000" step="500000" value="2500000" required />
          </div>
        </div>
        <div class="form-group">
          <label for="gr-facility">Fasilitas Penarikan <span class="required-mark">*</span></label>
          <select id="gr-facility" class="input-control" required>
            <option value="kombinasi">Buku Cek (25 lbr) + Bilyet Giro (25 lbr)</option>
            <option value="cek">Hanya Buku Cek (25 lembar)</option>
            <option value="bg">Hanya Buku Bilyet Giro (25 lembar)</option>
            <option value="digital">Pemindahbukuan Digital (Tanpa Warkat)</option>
          </select>
        </div>
      </div>
      <label class="checkbox-row">
        <input type="checkbox" required checked />
        <span>Saya menyatakan data usaha benar & menyetujui biaya admin Rp 25.000/bulan.</span>
      </label>
      <button type="submit" class="btn btn-primary btn-lg w-full">
        <i data-lucide="user-check" width="18" height="18"></i>
        Ajukan Rekening Giro Sekarang
      </button>
    </form>
  `;
}

/**
 * Tanggung jawab tunggal: Merender sub-layar Pengajuan Produk In-App
 * dan menangani submit untuk Tabungan, Deposito, dan Giro.
 */
export function renderApplyScreen(container: HTMLElement, params?: RouteParams): void {
  let selectedProduct: ProductKind = params?.product ?? 'tabungan';

  const draw = (): void => {
    container.innerHTML = `
      <div class="screen-stack">
        <div class="segmented-bar" role="tablist">
          <button type="button" class="seg-btn ${selectedProduct === 'tabungan' ? 'active' : ''}" data-apply-switch="tabungan">
            <i data-lucide="wallet" width="16" height="16"></i> Tabungan
          </button>
          <button type="button" class="seg-btn ${selectedProduct === 'deposito' ? 'active' : ''}" data-apply-switch="deposito">
            <i data-lucide="trending-up" width="16" height="16"></i> Deposito
          </button>
          <button type="button" class="seg-btn ${selectedProduct === 'giro' ? 'active' : ''}" data-apply-switch="giro">
            <i data-lucide="building-2" width="16" height="16"></i> Giro Niaga
          </button>
        </div>

        <div class="surface-plate form-plate">
          ${
            selectedProduct === 'tabungan'
              ? renderTabunganForm()
              : selectedProduct === 'deposito'
                ? renderDepositoForm(params?.prefillAmount, params?.prefillTenor)
                : renderGiroForm()
          }
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-apply-switch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedProduct = btn.dataset.applySwitch as ProductKind;
        draw();
      });
    });

    bindActiveForm();
    renderLucideIcons();
  };

  const bindActiveForm = (): void => {
    document.getElementById('app-form-tabungan')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = (document.getElementById('tb-name') as HTMLInputElement).value.trim();
      const nik = (document.getElementById('tb-nik') as HTMLInputElement).value.trim();
      const phone = (document.getElementById('tb-phone') as HTMLInputElement).value.trim();
      const email = (document.getElementById('tb-email') as HTMLInputElement).value.trim();
      const initialDeposit = Number((document.getElementById('tb-deposit') as HTMLInputElement).value);

      if (initialDeposit < PRODUCT_RULES.savings.minInitialDeposit) {
        window.alert(`Setoran awal min. ${formatIDR(PRODUCT_RULES.savings.minInitialDeposit)}.`);
        return;
      }

      const acc = accountService.createSavingsAccount({ fullName, nik, phone, email, initialDeposit });
      ledgerService.recordEntry({
        productKind: 'tabungan',
        accountNumber: acc.accountNumber,
        description: 'Setoran Awal Pembukaan Tabungan Lentera',
        amount: acc.balance,
      });

      modalController.show({
        badge: 'Tabungan Aktif',
        title: 'Tabungan Lentera Resmi Aktif!',
        subtitle: 'Nomor rekening dan kartu debit virtual siap digunakan.',
        rows: [
          { label: 'Nomor Rekening', value: acc.accountNumber, highlight: true },
          { label: 'Kartu Virtual', value: acc.cardNumber },
          { label: 'Saldo Aktif', value: formatIDR(acc.balance), highlight: true },
        ],
        ctaLabel: 'Lihat Detail Rekening',
        onConfirm: () => routerService.navigate('account-detail', { accountId: acc.id }),
      });
    });

    document.getElementById('app-form-deposito')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const holderName = (document.getElementById('dp-name') as HTMLInputElement).value.trim();
      const sourceAccount = (document.getElementById('dp-source') as HTMLSelectElement).value;
      const principalAmount = Number((document.getElementById('dp-amount') as HTMLInputElement).value);
      const tenorMonths = Number((document.getElementById('dp-tenor') as HTMLSelectElement).value);
      const rolloverMode = (document.getElementById('dp-aro') as HTMLSelectElement).value as DepositRolloverMode;

      if (principalAmount < PRODUCT_RULES.deposit.minPlacement) {
        window.alert(`Penempatan min. ${formatIDR(PRODUCT_RULES.deposit.minPlacement)}.`);
        return;
      }

      const acc = accountService.createDepositAccount({
        holderName,
        sourceAccount,
        principalAmount,
        tenorMonths,
        rolloverMode,
      });
      ledgerService.recordEntry({
        productKind: 'deposito',
        accountNumber: acc.accountNumber,
        description: `Penempatan Deposito ${acc.tenorMonths} Bln (${acc.certificateNumber})`,
        amount: acc.balance,
      });

      modalController.show({
        badge: 'e-Bilyet Terbit',
        title: 'e-Bilyet Deposito Berhasil Dibuat!',
        subtitle: 'Sertifikat deposito elektronik telah tersimpan di portofolio Anda.',
        rows: [
          { label: 'Nomor e-Bilyet', value: acc.certificateNumber, highlight: true },
          { label: 'Tenor & Bunga', value: `${acc.tenorMonths} Bln (${acc.interestRatePa.toFixed(2)}% p.a.)` },
          { label: 'Instruksi Rollover', value: ROLLOVER_LABELS[acc.rolloverMode] },
          { label: 'Estimasi Jatuh Tempo', value: formatIDR(acc.estimatedMaturityTotal), highlight: true },
        ],
        ctaLabel: 'Lihat e-Bilyet Deposito',
        onConfirm: () => routerService.navigate('account-detail', { accountId: acc.id }),
      });
    });

    document.getElementById('app-form-giro')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const category = (document.getElementById('gr-type') as HTMLSelectElement).value as GiroApplicantCategory;
      const entityName = (document.getElementById('gr-entity-name') as HTMLInputElement).value.trim();
      const npwp = (document.getElementById('gr-npwp') as HTMLInputElement).value.trim();
      const businessSector = (document.getElementById('gr-nib') as HTMLInputElement).value.trim();
      const initialDeposit = Number((document.getElementById('gr-deposit') as HTMLInputElement).value);
      const facility = (document.getElementById('gr-facility') as HTMLSelectElement).value as GiroFacilityOption;

      if (initialDeposit < PRODUCT_RULES.giro.minInitialDeposit) {
        window.alert(`Setoran awal Giro min. ${formatIDR(PRODUCT_RULES.giro.minInitialDeposit)}.`);
        return;
      }

      const acc = accountService.createGiroAccount({
        category,
        entityName,
        npwp,
        businessSector,
        initialDeposit,
        facility,
      });
      ledgerService.recordEntry({
        productKind: 'giro',
        accountNumber: acc.accountNumber,
        description: `Setoran Awal Giro Niaga — ${acc.holderName}`,
        amount: acc.balance,
      });

      modalController.show({
        badge: 'Giro Niaga Aktif',
        title: 'Rekening Giro Niaga Disetujui!',
        subtitle: 'Rekening koran bisnis dan fasilitas warkat telah diaktifkan.',
        rows: [
          { label: 'No. Rekening Giro', value: acc.accountNumber, highlight: true },
          { label: 'Entitas', value: acc.holderName },
          { label: 'Fasilitas', value: GIRO_FACILITY_LABELS[acc.facility] },
          { label: 'Saldo Awal', value: formatIDR(acc.balance), highlight: true },
        ],
        ctaLabel: 'Lihat Detail Giro',
        onConfirm: () => routerService.navigate('account-detail', { accountId: acc.id }),
      });
    });
  };

  draw();
}
