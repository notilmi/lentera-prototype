import { BANK_PROFILE } from '../config/bank-profile.ts';
import { authService } from '../services/auth.service.ts';

/**
 * Tanggung jawab tunggal: Merender Public Landing Page LENTERA Bank
 * (Homepage, Katalog 3 Simpanan, dan Profil Singkat Bank sesuai UAS Tahap 1).
 */
export function renderLandingScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="public-page">
      <!-- Minimal Borderless Public Header -->
      <header class="public-header">
        <div class="public-container public-header-inner">
          <a href="#pub-hero" class="sidebar-brand">
            <div class="logo-mark">
              <i data-lucide="sun" width="22" height="22"></i>
            </div>
            <div class="brand-wordmark">
              <span class="brand-name">${BANK_PROFILE.shortName}</span>
              <span class="brand-sub">Digital Bank</span>
            </div>
          </a>

          <nav class="public-nav-links" aria-label="Navigasi Publik">
            <a href="#pub-produk">Simpanan</a>
            <a href="#pub-keunggulan">Keunggulan</a>
            <a href="#pub-tentang">Tentang Bank</a>
          </nav>

          <div class="public-header-actions">
            <button type="button" class="btn btn-tertiary btn-sm" id="pub-nav-login">Masuk</button>
            <button type="button" class="btn btn-primary btn-sm" id="pub-nav-register">Daftar</button>
          </div>
        </div>
      </header>

      <!-- Hero Band -->
      <section class="public-hero" id="pub-hero">
        <div class="public-container public-hero-grid">
          <div>
            <span class="pill-badge badge-lime">
              <i data-lucide="sparkles" width="14" height="14"></i>
              ${BANK_PROFILE.longTagline}
            </span>
            <h1 class="public-hero-title">${BANK_PROFILE.shortTagline}</h1>
            <p class="public-hero-desc">
              Satu aplikasi m-banking transparan untuk mengelola <strong>Tabungan</strong>,
              memaksimalkan <strong>Deposito</strong>, dan memperlancar transaksi bisnis melalui
              <strong>Giro Niaga</strong>.
            </p>
            <div class="public-hero-cta">
              <button type="button" class="btn btn-primary btn-lg" id="pub-hero-register">
                Buka Rekening Gratis
                <i data-lucide="arrow-right" width="18" height="18"></i>
              </button>
              <button type="button" class="btn btn-tertiary btn-lg" id="pub-hero-login">
                Masuk M-Banking
              </button>
            </div>
          </div>

          <div class="public-hero-card-wrap">
            <div class="virtual-debit-card">
              <div class="card-top-row">
                <span class="card-chip-badge">
                  <i data-lucide="credit-card" width="14" height="14"></i>
                  LENTERA M-Banking
                </span>
                <span class="card-brand-text">LENTERA</span>
              </div>
              <div class="card-number-display">8820 •••• •••• 9102</div>
              <div class="card-bottom-row">
                <div>
                  <span class="card-meta-label">Simpanan Digital</span>
                  <div class="card-holder-value">TABUNGAN • DEPOSITO • GIRO</div>
                </div>
                <span class="pill-badge badge-lime">0% ADMIN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3 Funding Products Showcase -->
      <section class="public-section" id="pub-produk">
        <div class="public-container">
          <div class="public-section-head">
            <span class="pill-badge">Produk Simpanan (Funding)</span>
            <h2>Tiga Layanan Utama LENTERA Bank</h2>
            <p>Dirancang khusus untuk kebutuhan transaksi harian, investasi terukur, hingga arus kas usaha.</p>
          </div>

          <div class="catalog-grid">
            <article class="catalog-card is-featured">
              <div class="catalog-card-head">
                <span class="tile-icon-badge is-lime"><i data-lucide="wallet" width="20" height="20"></i></span>
                <span class="pill-badge badge-lime">3.50% p.a.</span>
              </div>
              <h3>Tabungan Lentera</h3>
              <p class="catalog-desc">Bebas biaya administrasi bulanan dengan setoran awal ringan dan kartu debit virtual instan.</p>
              <ul class="spec-list">
                <li><span>Setoran Awal Min.</span><strong>Rp 50.000</strong></li>
                <li><span>Biaya Admin</span><strong class="text-positive">Rp 0 / Bulan</strong></li>
              </ul>
              <button type="button" class="btn btn-primary w-full" data-pub-auth="register">
                Buka Tabungan <i data-lucide="arrow-up-right" width="16" height="16"></i>
              </button>
            </article>

            <article class="catalog-card">
              <div class="catalog-card-head">
                <span class="tile-icon-badge"><i data-lucide="trending-up" width="20" height="20"></i></span>
                <span class="pill-badge">s/d 4.75% p.a.</span>
              </div>
              <h3>Deposito Lentera Maxima</h3>
              <p class="catalog-desc">Simpanan berjangka dengan pilihan tenor 1, 3, 6, hingga 12 bulan dan e-Bilyet digital resmi.</p>
              <ul class="spec-list">
                <li><span>Min. Penempatan</span><strong>Rp 1.000.000</strong></li>
                <li><span>Opsi Rollover</span><strong>ARO / Non-ARO</strong></li>
              </ul>
              <button type="button" class="btn btn-tertiary w-full" data-pub-auth="register">
                Mulai Deposito <i data-lucide="arrow-up-right" width="16" height="16"></i>
              </button>
            </article>

            <article class="catalog-card">
              <div class="catalog-card-head">
                <span class="tile-icon-badge"><i data-lucide="building-2" width="20" height="20"></i></span>
                <span class="pill-badge">1.50% p.a.</span>
              </div>
              <h3>Giro Lentera Niaga</h3>
              <p class="catalog-desc">Solusi likuiditas perorangan usaha & korporasi lengkap dengan Cek, Bilyet Giro, dan e-Statement.</p>
              <ul class="spec-list">
                <li><span>Setoran Awal Min.</span><strong>Rp 1.000.000</strong></li>
                <li><span>Biaya Admin</span><strong>Rp 25.000 / Bulan</strong></li>
              </ul>
              <button type="button" class="btn btn-tertiary w-full" data-pub-auth="register">
                Ajukan Giro <i data-lucide="arrow-up-right" width="16" height="16"></i>
              </button>
            </article>
          </div>
        </div>
      </section>

      <!-- Keunggulan & Identitas Bank (UAS Stage 1) -->
      <section class="public-section" id="pub-keunggulan">
        <div class="public-container">
          <div class="public-trust-plate" id="pub-tentang">
            <div class="public-trust-left">
              <span class="pill-badge badge-lime">${BANK_PROFILE.category}</span>
              <h2>Kenapa Memilih ${BANK_PROFILE.name}?</h2>
              <p>
                Kami menghadirkan layanan perbankan digital yang jernih, tanpa klausul tersembunyi,
                dan dapat diakses penuh dari desktop maupun perangkat mobile.
              </p>
              <div class="public-trust-points">
                <div><i data-lucide="shield-check" width="18" height="18"></i> Transparansi bunga & biaya penuh</div>
                <div><i data-lucide="clock" width="18" height="18"></i> Pembukaan rekening & e-Bilyet instan</div>
                <div><i data-lucide="landmark" width="18" height="18"></i> ${BANK_PROFILE.academic.institution} • ${BANK_PROFILE.academic.course}</div>
              </div>
            </div>
            <div class="public-trust-cta">
              <button type="button" class="btn btn-primary btn-lg w-full" id="pub-bottom-demo">
                <i data-lucide="sparkles" width="18" height="18"></i>
                Coba Langsung Akun Demo
              </button>
              <button type="button" class="btn btn-secondary w-full" id="pub-bottom-register">
                Daftar Akun Baru
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  document.getElementById('pub-nav-login')?.addEventListener('click', () => {
    authService.navigatePublic('login');
  });
  document.getElementById('pub-hero-login')?.addEventListener('click', () => {
    authService.navigatePublic('login');
  });
  document.getElementById('pub-nav-register')?.addEventListener('click', () => {
    authService.navigatePublic('register');
  });
  document.getElementById('pub-hero-register')?.addEventListener('click', () => {
    authService.navigatePublic('register');
  });
  document.getElementById('pub-bottom-register')?.addEventListener('click', () => {
    authService.navigatePublic('register');
  });
  document.getElementById('pub-bottom-demo')?.addEventListener('click', () => {
    authService.loginDemo();
  });

  container.querySelectorAll<HTMLButtonElement>('[data-pub-auth]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.pubAuth === 'login' ? 'login' : 'register';
      authService.navigatePublic(target);
    });
  });
}
