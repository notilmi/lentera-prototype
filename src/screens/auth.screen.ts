import { BANK_PROFILE } from '../config/bank-profile.ts';
import { accountService } from '../services/account.service.ts';
import { authService } from '../services/auth.service.ts';
import { ledgerService } from '../services/ledger.service.ts';
import { routerService } from '../services/router.service.ts';
import { renderLucideIcons } from '../ui/icons.ts';

/**
 * Tanggung jawab tunggal: Merender halaman Login & Register (client-side only)
 * dengan 1-click Demo Login dan personalisasi akun pendaftar baru.
 */
export function renderAuthScreen(container: HTMLElement, mode: 'login' | 'register'): void {
  let showPin = false;
  let errorMessage = '';

  const draw = (): void => {
    const isLogin = mode === 'login';

    container.innerHTML = `
      <div class="auth-page">
        <div class="auth-topbar">
          <button type="button" class="btn btn-secondary btn-sm" id="auth-back-landing">
            <i data-lucide="arrow-left" width="16" height="16"></i>
            Kembali ke Beranda
          </button>
        </div>

        <div class="auth-card">
          <div class="auth-card-brand">
            <div class="logo-mark">
              <i data-lucide="sun" width="22" height="22"></i>
            </div>
            <div>
              <strong class="brand-name">${BANK_PROFILE.shortName}</strong>
              <span class="brand-sub">M-Banking Access</span>
            </div>
          </div>

          <h1 class="auth-title">${isLogin ? 'Masuk ke LENTERA' : 'Daftar Akun LENTERA'}</h1>
          <p class="auth-subtitle">
            ${
              isLogin
                ? 'Akses saldo Tabungan, Deposito, dan Giro Anda secara instan.'
                : 'Buat profil nasabah simulasi dan langsung dapatkan Tabungan Lentera aktif.'
            }
          </p>

          ${errorMessage ? `<div class="auth-error-banner">${errorMessage}</div>` : ''}

          ${
            isLogin
              ? `
                <form id="auth-login-form">
                  <div class="form-group">
                    <label for="login-id">Email atau Nomor HP</label>
                    <input
                      type="text"
                      id="login-id"
                      class="input-control"
                      placeholder="raka.pratama@lentera.id"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="login-pin">PIN / Kata Sandi</label>
                    <div class="input-password-wrap">
                      <input
                        type="${showPin ? 'text' : 'password'}"
                        id="login-pin"
                        class="input-control"
                        placeholder="Minimal 6 karakter"
                        minlength="6"
                        required
                      />
                      <button type="button" class="pin-eye-btn" id="auth-toggle-pin" aria-label="Tampilkan atau sembunyikan PIN">
                        <i data-lucide="${showPin ? 'eye-off' : 'eye'}" width="16" height="16"></i>
                      </button>
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary btn-lg w-full">
                    Masuk M-Banking
                    <i data-lucide="arrow-right" width="18" height="18"></i>
                  </button>
                </form>

                <div class="auth-divider"><span>atau akses cepat presentasi</span></div>

                <button type="button" class="btn btn-tertiary w-full" id="auth-demo-login">
                  <i data-lucide="sparkles" width="16" height="16"></i>
                  Masuk Cepat — Akun Demo (Raka Pratama)
                </button>

                <p class="auth-switch-text">
                  Belum punya akun LENTERA?
                  <button type="button" class="auth-switch-link" id="auth-go-register">Daftar sekarang</button>
                </p>
              `
              : `
                <form id="auth-register-form">
                  <div class="form-group">
                    <label for="reg-name">Nama Lengkap (Sesuai KTP)</label>
                    <input type="text" id="reg-name" class="input-control" placeholder="Contoh: Nadia Kusuma" required />
                  </div>
                  <div class="form-group">
                    <label for="reg-email">Alamat Email</label>
                    <input type="email" id="reg-email" class="input-control" placeholder="nadia@lentera.id" required />
                  </div>
                  <div class="form-group">
                    <label for="reg-phone">Nomor WhatsApp / HP</label>
                    <input type="tel" id="reg-phone" class="input-control" placeholder="081234567890" required />
                  </div>
                  <div class="form-group">
                    <label for="reg-nik">NIK (16 Digit Simulasi)</label>
                    <input type="text" id="reg-nik" class="input-control" placeholder="1607011205020001" maxlength="16" pattern="\\d{16}" required />
                  </div>
                  <div class="form-group">
                    <label for="reg-pin">Buat PIN / Kata Sandi (Min. 6 karakter)</label>
                    <div class="input-password-wrap">
                      <input
                        type="${showPin ? 'text' : 'password'}"
                        id="reg-pin"
                        class="input-control"
                        placeholder="Minimal 6 karakter"
                        minlength="6"
                        required
                      />
                      <button type="button" class="pin-eye-btn" id="auth-toggle-pin" aria-label="Tampilkan atau sembunyikan PIN">
                        <i data-lucide="${showPin ? 'eye-off' : 'eye'}" width="16" height="16"></i>
                      </button>
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary btn-lg w-full">
                    <i data-lucide="user-plus" width="18" height="18"></i>
                    Buat Akun & Masuk Aplikasi
                  </button>
                </form>

                <p class="auth-switch-text">
                  Sudah punya akun?
                  <button type="button" class="auth-switch-link" id="auth-go-login">Masuk di sini</button>
                </p>
              `
          }
        </div>
      </div>
    `;

    document.getElementById('auth-back-landing')?.addEventListener('click', () => {
      authService.navigatePublic('landing');
    });

    document.getElementById('auth-toggle-pin')?.addEventListener('click', () => {
      showPin = !showPin;
      draw();
    });

    document.getElementById('auth-go-register')?.addEventListener('click', () => {
      authService.navigatePublic('register');
    });

    document.getElementById('auth-go-login')?.addEventListener('click', () => {
      authService.navigatePublic('login');
    });

    document.getElementById('auth-demo-login')?.addEventListener('click', () => {
      accountService.resetToSeed();
      ledgerService.resetToSeed();
      routerService.navigate('home');
      authService.loginDemo();
    });

    document.getElementById('auth-login-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const idVal = (document.getElementById('login-id') as HTMLInputElement).value;
      const pinVal = (document.getElementById('login-pin') as HTMLInputElement).value;
      const result = authService.loginWithCredentials(idVal, pinVal);
      if (!result.ok) {
        errorMessage = result.error ?? 'Gagal masuk.';
        draw();
        return;
      }
      routerService.navigate('home');
    });

    document.getElementById('auth-register-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const fullName = (document.getElementById('reg-name') as HTMLInputElement).value;
      const email = (document.getElementById('reg-email') as HTMLInputElement).value;
      const phone = (document.getElementById('reg-phone') as HTMLInputElement).value;
      const nik = (document.getElementById('reg-nik') as HTMLInputElement).value;
      const pin = (document.getElementById('reg-pin') as HTMLInputElement).value;

      const result = authService.registerUser({ fullName, email, phone, nik, pin });
      if (!result.ok || !result.user) {
        errorMessage = result.error ?? 'Gagal mendaftar.';
        draw();
        return;
      }

      const initialAcc = accountService.initializeForRegisteredUser(result.user);
      ledgerService.initializeForRegisteredUser(initialAcc.accountNumber, initialAcc.balance);
      routerService.navigate('home');
    });

    renderLucideIcons();
  };

  draw();
}
