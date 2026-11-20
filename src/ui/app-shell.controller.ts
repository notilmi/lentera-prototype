import { MOCK_CUSTOMER } from '../config/seed-data.ts';
import { routerService } from '../services/router.service.ts';
import type { MainTabRoute, NavigationEntry, ScreenRoute } from '../types/navigation.ts';
import { modalController } from './modal.controller.ts';

const SCREEN_TITLES: Record<ScreenRoute, { title: string; subtitle: string }> = {
  home: { title: `Halo, ${MOCK_CUSTOMER.fullName.split(' ')[0]}`, subtitle: 'Ringkasan finansial LENTERA Bank Anda' },
  simpanan: { title: 'Simpanan', subtitle: 'Tabungan, Deposito & Giro dalam satu tempat' },
  transaksi: { title: 'Transaksi Digital', subtitle: 'Transfer, Tagihan, QRIS & e-Wallet (Tahap 3)' },
  kredit: { title: 'Produk Kredit', subtitle: 'Pinjaman Konsumtif & UMKM (Tahap 2)' },
  riwayat: { title: 'Riwayat Mutasi', subtitle: 'Catatan seluruh aktivitas rekening Anda' },
  profil: { title: 'Profil & Info Bank', subtitle: 'Akun nasabah dan identitas LENTERA Bank' },
  'account-detail': { title: 'Detail Rekening', subtitle: 'Informasi rekening, sertifikat & mutasi' },
  apply: { title: 'Pengajuan Produk', subtitle: 'Pembukaan rekening simpanan langsung di aplikasi' },
};

/**
 * Tanggung jawab tunggal: Mengelola sinkronisasi Left Sidebar (desktop),
 * Top Contextual App Bar (tombol Back & judul layar), dan Bottom Tab Bar (mobile).
 */
export function initAppShellController(): void {
  const navButtons = document.querySelectorAll<HTMLButtonElement>('[data-nav-route]');
  const backBtn = document.getElementById('topbar-back-btn');
  const titleEl = document.getElementById('topbar-title');
  const subtitleEl = document.getElementById('topbar-subtitle');
  const notifBtn = document.getElementById('topbar-notif-btn');
  const sidebarOpenBtn = document.getElementById('sidebar-quick-open-btn');

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.navRoute as MainTabRoute | undefined;
      if (target) routerService.navigate(target);
    });
  });

  backBtn?.addEventListener('click', () => routerService.back());

  sidebarOpenBtn?.addEventListener('click', () => {
    routerService.navigate('apply', { product: 'tabungan' });
  });

  notifBtn?.addEventListener('click', () => {
    modalController.show({
      badge: 'Pusat Notifikasi',
      title: 'Notifikasi Nasabah',
      subtitle: 'Pemberitahuan terbaru dari ekosistem LENTERA Bank.',
      rows: [
        { label: 'Bunga Harian Masuk', value: '+ Rp 18.450 (20 Nov)' },
        { label: 'Status Akun', value: 'Terverifikasi Aktif', highlight: true },
        { label: 'Layanan Tahap 1', value: 'Tabungan, Deposito & Giro siap digunakan' },
      ],
      ctaLabel: 'Tutup Notifikasi',
    });
  });

  const syncShell = (current: NavigationEntry, canGoBack: boolean): void => {
    const activeTab = routerService.getActiveMainTab();
    const meta = SCREEN_TITLES[current.route];

    if (titleEl) titleEl.textContent = meta.title;
    if (subtitleEl) subtitleEl.textContent = meta.subtitle;
    if (backBtn) {
      backBtn.classList.toggle('hidden', !canGoBack);
    }

    navButtons.forEach((btn) => {
      const isMatch = btn.dataset.navRoute === activeTab;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-current', isMatch ? 'page' : 'false');
    });
  };

  routerService.subscribe(syncShell);
}
