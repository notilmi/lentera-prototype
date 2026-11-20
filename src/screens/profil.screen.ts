import { BANK_PROFILE } from '../config/bank-profile.ts';
import { accountService } from '../services/account.service.ts';
import { authService } from '../services/auth.service.ts';
import { extractInitials } from '../services/format.service.ts';
import { ledgerService } from '../services/ledger.service.ts';
import { routerService } from '../services/router.service.ts';
import { modalController } from '../ui/modal.controller.ts';

/**
 * Tanggung jawab tunggal: Merender layar Profil Nasabah, Reset Simulasi, Logout,
 * serta Identitas & Profil LENTERA Bank (memenuhi rubrik UAS di dalam app).
 */
export function renderProfilScreen(container: HTMLElement): void {
  const user = authService.getCurrentUser();

  container.innerHTML = `
    <div class="screen-stack">
      <!-- Dynamic Customer Identity Card -->
      <div class="surface-plate profile-hero-plate">
        <div class="profile-hero-left">
          <div class="profile-avatar-lg">${extractInitials(user.fullName)}</div>
          <div>
            <span class="pill-badge badge-lime">${user.tier}</span>
            <h2 class="profile-name">${user.fullName}</h2>
            <p class="profile-meta">${user.cif} • ${user.email}</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary btn-sm" id="profil-reset-btn">
            <i data-lucide="rotate-ccw" width="15" height="15"></i>
            Reset Simulasi
          </button>
          <button type="button" class="btn btn-tertiary btn-sm" id="profil-logout-btn">
            <i data-lucide="log-out" width="15" height="15"></i>
            Keluar
          </button>
        </div>
      </div>

      <!-- Identitas & Profil Bank LENTERA (UAS Tahap 1) -->
      <div class="surface-plate">
        <div class="plate-head-row">
          <h3>Tentang ${BANK_PROFILE.name}</h3>
          <span class="pill-badge">${BANK_PROFILE.category}</span>
        </div>

        <div class="motto-plate">
          <div>
            <span class="motto-label">Tagline Panjang</span>
            <p class="motto-quote">"${BANK_PROFILE.longTagline}"</p>
          </div>
          <div>
            <span class="motto-label">Tagline Pendek</span>
            <p class="motto-quote">"${BANK_PROFILE.shortTagline}"</p>
          </div>
        </div>

        <ul class="spec-list detail-spec-list">
          <li><span>Institusi</span><strong>${BANK_PROFILE.academic.institution}</strong></li>
          <li><span>Jurusan</span><strong>${BANK_PROFILE.academic.department}</strong></li>
          <li><span>Mata Kuliah</span><strong>${BANK_PROFILE.academic.course} • ${BANK_PROFILE.academic.semester}</strong></li>
          <li><span>Dosen Pengampu</span><strong>${BANK_PROFILE.academic.lecturer}</strong></li>
          <li><span>Milestone Aktif</span><strong>${BANK_PROFILE.academic.stage}</strong></li>
        </ul>
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
      subtitle: 'Portofolio dan mutasi telah dikembalikan ke kondisi awal akun demo.',
      rows: [
        { label: 'Rekening Aktif', value: '1 Tabungan Lentera (Rp 12.500.000)', highlight: true },
        { label: 'Mutasi Awal', value: '3 Transaksi Tersimpan' },
      ],
      ctaLabel: 'Ke Beranda',
      onConfirm: () => routerService.navigate('home'),
    });
  });

  document.getElementById('profil-logout-btn')?.addEventListener('click', () => {
    authService.logout();
  });
}
