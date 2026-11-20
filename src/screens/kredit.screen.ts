import { modalController } from '../ui/modal.controller.ts';

/**
 * Tanggung jawab tunggal: Merender layar Produk Kredit (Preview Tahap 2).
 */
export function renderKreditScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-stack">
      <div class="roadmap-banner">
        <span class="pill-badge badge-lime">Tahap 2 • Segera Hadir</span>
        <h2>Produk Kredit & Pembiayaan</h2>
        <p>Fasilitas penyaluran dana kepada nasabah individu dan UMKM akan tersedia pada pengembangan Tahap 2.</p>
      </div>

      <div class="catalog-grid two-col">
        <article class="catalog-card">
          <div class="catalog-card-head">
            <span class="tile-icon-badge"><i data-lucide="credit-card" width="20" height="20"></i></span>
            <span class="pill-badge">Tahap 2</span>
          </div>
          <h3>Kredit Konsumtif Lentera</h3>
          <p class="catalog-desc">Pinjaman personal fleksibel untuk kebutuhan pendidikan, renovasi, dan multiguna.</p>
          <ul class="spec-list">
            <li><span>Plafon Pembiayaan</span><strong>s/d Rp 200.000.000</strong></li>
            <li><span>Pilihan Tenor</span><strong>6 – 60 Bulan</strong></li>
            <li><span>Suku Bunga</span><strong>Mulai 0.88% / Bulan</strong></li>
            <li><span>Fitur Mendatang</span><strong>Formulir Pengajuan In-App</strong></li>
          </ul>
          <button type="button" class="btn btn-secondary w-full" data-credit-preview="konsumtif">
            Lihat Info Tahap 2
          </button>
        </article>

        <article class="catalog-card">
          <div class="catalog-card-head">
            <span class="tile-icon-badge"><i data-lucide="building-2" width="20" height="20"></i></span>
            <span class="pill-badge">Tahap 2</span>
          </div>
          <h3>Kredit Produktif / UMKM</h3>
          <p class="catalog-desc">Pembiayaan modal kerja dan investasi untuk mendorong pertumbuhan usaha mikro & kecil.</p>
          <ul class="spec-list">
            <li><span>Plafon Pembiayaan</span><strong>s/d Rp 500.000.000</strong></li>
            <li><span>Pilihan Tenor</span><strong>12 – 60 Bulan</strong></li>
            <li><span>Tujuan Kredit</span><strong>Modal Kerja & Ekspansi</strong></li>
            <li><span>Fitur Mendatang</span><strong>Formulir Pengajuan UMKM</strong></li>
          </ul>
          <button type="button" class="btn btn-secondary w-full" data-credit-preview="umkm">
            Lihat Info Tahap 2
          </button>
        </article>
      </div>
    </div>
  `;

  container.querySelectorAll<HTMLButtonElement>('[data-credit-preview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const isUmkm = btn.dataset.creditPreview === 'umkm';
      modalController.show({
        badge: 'Roadmap Tahap 2',
        title: isUmkm ? 'Kredit Produktif / UMKM' : 'Kredit Konsumtif Lentera',
        subtitle: 'Modul pengajuan kredit sedang dipersiapkan untuk milestone Tahap 2 UAS.',
        rows: [
          { label: 'Status', value: 'Segera Hadir pada Tahap 2', highlight: true },
          { label: 'Cakupan Fitur', value: 'Detail plafon, tenor, syarat, bunga & formulir pengajuan' },
          { label: 'Catatan', value: 'Simulasi alur layanan tanpa analisis kredit otomatis' },
        ],
        ctaLabel: 'Tutup',
      });
    });
  });
}
