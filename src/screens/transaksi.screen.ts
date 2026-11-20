import { modalController } from '../ui/modal.controller.ts';

interface DigitalServicePreview {
  id: string;
  icon: string;
  title: string;
  desc: string;
  plannedFeature: string;
}

const DIGITAL_SERVICES: readonly DigitalServicePreview[] = [
  {
    id: 'transfer',
    icon: 'send',
    title: 'Transfer Dana',
    desc: 'Kirim dana sesama LENTERA Bank maupun antar bank nasional.',
    plannedFeature: 'Formulir transfer simulasi & pemilihan rekening sumber',
  },
  {
    id: 'qris',
    icon: 'qr-code',
    title: 'Pembayaran QRIS',
    desc: 'Scan & bayar cepat di seluruh merchant berlogo QRIS.',
    plannedFeature: 'Tampilan simulasi pemindaian & struk QRIS',
  },
  {
    id: 'tagihan',
    icon: 'receipt-text',
    title: 'Pembayaran Tagihan',
    desc: 'Bayar listrik PLN, PDAM, internet, BPJS, dan pulsa.',
    plannedFeature: 'Pilihan kategori tagihan & konfirmasi pembayaran simulasi',
  },
  {
    id: 'ewallet',
    icon: 'smartphone',
    title: 'Top Up e-Wallet',
    desc: 'Isi saldo GoPay, OVO, DANA, dan ShopeePay seketika.',
    plannedFeature: 'Tampilan pilihan dompet digital & nominal cepat',
  },
];

/**
 * Tanggung jawab tunggal: Merender layar Transaksi (Layanan Digital — Preview Tahap 3).
 */
export function renderTransaksiScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-stack">
      <div class="roadmap-banner">
        <span class="pill-badge badge-lime">Tahap 3 • Segera Hadir</span>
        <h2>Layanan Transaksi Digital</h2>
        <p>Seluruh fitur transaksi harian berikut akan diaktifkan pada pengembangan Tahap 3 sesuai silabus UAS Perbankan Digital.</p>
      </div>

      <div class="service-action-grid">
        ${DIGITAL_SERVICES.map(
          (svc) => `
          <button type="button" class="service-action-card" data-preview-svc="${svc.id}">
            <div class="service-card-top">
              <span class="tile-icon-badge"><i data-lucide="${svc.icon}" width="20" height="20"></i></span>
              <span class="pill-badge">Tahap 3</span>
            </div>
            <h3>${svc.title}</h3>
            <p>${svc.desc}</p>
            <span class="service-link">Lihat Rencana Fitur <i data-lucide="chevron-right" width="15" height="15"></i></span>
          </button>
        `
        ).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll<HTMLButtonElement>('[data-preview-svc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const svc = DIGITAL_SERVICES.find((item) => item.id === btn.dataset.previewSvc);
      if (!svc) return;
      modalController.show({
        badge: 'Roadmap Tahap 3',
        title: svc.title,
        subtitle: svc.desc,
        rows: [
          { label: 'Status Pengembangan', value: 'Segera Hadir (Tahap 3)', highlight: true },
          { label: 'Rencana Fitur', value: svc.plannedFeature },
          { label: 'Mode Transaksi', value: 'Simulasi Client-Facing (Tanpa Integrasi Bank Riil)' },
        ],
        ctaLabel: 'Mengerti',
      });
    });
  });
}
