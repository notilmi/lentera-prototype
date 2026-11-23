import { authService } from '../services/auth.service.ts';
import { extractInitials } from '../services/format.service.ts';
import { routerService } from '../services/router.service.ts';
import type { MainTabRoute, NavigationEntry, ScreenRoute } from '../types/navigation.ts';
import { modalController } from './modal.controller.ts';

function getScreenMeta(route: ScreenRoute): { title: string; subtitle: string } {
  const firstName = authService.getCurrentUser().fullName.split(' ')[0] || 'Nasabah';

  const map: Record<ScreenRoute, { title: string; subtitle: string }> = {
    home: { title: `Halo, ${firstName}`, subtitle: 'Ringkasan finansial LENTERA Bank Anda' },
    simpanan: { title: 'Simpanan', subtitle: 'Tabungan, Deposito & Giro dalam satu tempat' },
    transaksi: { title: 'Transaksi Digital', subtitle: 'Transfer, Tagihan, QRIS & Top Up e-Wallet' },
    kredit: { title: 'Produk Kredit', subtitle: 'Pinjaman Konsumtif, UMKM & Simulasi Angsuran' },
    riwayat: { title: 'Riwayat Mutasi', subtitle: 'Catatan seluruh aktivitas rekening Anda' },
    profil: { title: 'Profil & Info Bank', subtitle: 'Akun nasabah dan identitas LENTERA Bank' },
    'account-detail': { title: 'Detail Rekening', subtitle: 'Informasi rekening, sertifikat & mutasi' },
    apply: { title: 'Pengajuan Produk', subtitle: 'Pembukaan rekening simpanan langsung di aplikasi' },
  };

  return map[route];
}

/**
 * Tanggung jawab tunggal: Mengelola sinkronisasi Left Sidebar (desktop),
 * Top Contextual App Bar (tombol Back & judul layar), Bottom Tab Bar (mobile),
 * serta info profil dinamis dari authService.
 */
export function initAppShellController(): void {
  const navButtons = document.querySelectorAll<HTMLButtonElement>('[data-nav-route]');
  const backBtn = document.getElementById('topbar-back-btn');
  const titleEl = document.getElementById('topbar-title');
  const subtitleEl = document.getElementById('topbar-subtitle');
  const notifBtn = document.getElementById('topbar-notif-btn');
  const sidebarOpenBtn = document.getElementById('sidebar-quick-open-btn');
  const sidebarAvatarEl = document.getElementById('sidebar-user-avatar');
  const sidebarNameEl = document.getElementById('sidebar-user-name');
  const sidebarTierEl = document.getElementById('sidebar-user-tier');

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
    const user = authService.getCurrentUser();
    modalController.show({
      badge: 'Pusat Notifikasi',
      title: 'Notifikasi Nasabah',
      subtitle: `Pemberitahuan terbaru untuk ${user.fullName}.`,
      rows: [
        { label: 'Status Akun', value: user.tier, highlight: true },
        { label: 'Nomor CIF', value: user.cif },
        { label: 'Layanan Tahap 1', value: 'Tabungan, Deposito & Giro siap digunakan' },
      ],
      ctaLabel: 'Tutup Notifikasi',
    });
  });

  const syncUserBadge = (): void => {
    const user = authService.getCurrentUser();
    if (sidebarAvatarEl) sidebarAvatarEl.textContent = extractInitials(user.fullName);
    if (sidebarNameEl) sidebarNameEl.textContent = user.fullName;
    if (sidebarTierEl) sidebarTierEl.textContent = user.tier;
  };

  const syncShell = (current: NavigationEntry, canGoBack: boolean): void => {
    const activeTab = routerService.getActiveMainTab();
    const meta = getScreenMeta(current.route);

    syncUserBadge();
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
  authService.subscribe(() => {
    syncShell(routerService.getCurrent(), routerService.canGoBack());
  });
}
