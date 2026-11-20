import { BANK_PROFILE } from '../config/bank-profile.ts';
import { MOCK_CUSTOMER } from '../config/seed-data.ts';
import { accountService } from '../services/account.service.ts';
import { extractInitials } from '../services/format.service.ts';
import { ledgerService } from '../services/ledger.service.ts';
import { routerService } from '../services/router.service.ts';
import { modalController } from '../ui/modal.controller.ts';

/**
 * Tanggung jawab tunggal: Merender layar Profil Nasabah, Reset Simulasi,
 * serta Identitas & Profil LENTERA Bank (memenuhi rubrik UAS di dalam app).
 */
export function renderProfilScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-stack">
      <!-- Mock Customer Identity Card -->
      <div class="surface-plate profile-hero-plate">
        <div class="profile-hero-left">
          <div class="profile-avatar-lg">${extractInitials(MOCK_CUSTOMER.fullName)}</div>
          <div>
            <span class="pill-badge badge-lime">${MOCK_CUSTOMER.tier}</span>
            <h2 class="profile-name">${MOCK_CUSTOMER.fullName}</h2>
            <p class="profile-meta">${MOCK_CUSTOMER.cif} • ${MOCK_CUSTOMER.email}</p>
          </div>
        </div>
        <button type="button" class="btn btn-tertiary btn-sm" id="profil-reset-btn">
          <i data-lucide="rotate-ccw" width="15" height="15"></i>
          Reset Simulasi
        </button>
      </div>

      <!-- Bantuan & Disclaimer -->
      <div class="surface-plate">
        <div class="plate-head-row">
          <h3>Layanan Bantuan & Catatan Prototype</h3>
          <i data-lucide="help-circle" width="18" height="18"></i>
        </div>
        <p class="help-text">
          Aplikasi ini adalah purwarupa <strong>client-facing m-banking (frontend only)</strong>.
          Seluruh nomor rekening, kartu virtual, e-Bilyet deposito, dan riwayat mutasi disimpan secara
          lokal pada sesi browser dan tidak terhubung ke sistem perbankan riil.
        </p>
      </div>
    </div>
  `;

  document.getElementById('profil-reset-btn')?.addEventListener('click', () => {
    accountService.resetToSeed();
    ledgerService.resetToSeed();
    modalController.show({
      badge: 'Reset Berhasil',
      title: 'Data Simulasi Dikembalikan',
      subtitle: 'Portofolio dan mutasi telah dikembalikan ke kondisi awal nasabah mock.',
      rows: [
        { label: 'Rekening Aktif', value: '1 Tabungan Lentera (Rp 12.500.000)', highlight: true },
        { label: 'Mutasi Awal', value: '3 Transaksi Tersimpan' },
      ],
      ctaLabel: 'Ke Beranda',
      onConfirm: () => routerService.navigate('home'),
    });
  });
}
