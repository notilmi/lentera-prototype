import { MOCK_CUSTOMER } from '../config/seed-data.ts';
import type {
  AuthState,
  PublicRoute,
  RegisteredCredentials,
  UserProfile,
} from '../types/auth.ts';
import { loadFromSession, saveToSession } from './storage.service.ts';

const AUTH_SESSION_KEY = 'lentera_mbanking_auth_session_v1';
const REGISTERED_USER_KEY = 'lentera_mbanking_registered_user_v1';

type AuthListener = (state: AuthState) => void;

function createDemoUser(): UserProfile {
  return {
    fullName: MOCK_CUSTOMER.fullName,
    cif: MOCK_CUSTOMER.cif,
    nik: MOCK_CUSTOMER.nik,
    phone: MOCK_CUSTOMER.phone,
    email: MOCK_CUSTOMER.email,
    tier: MOCK_CUSTOMER.tier,
    isDemo: true,
  };
}

function generateCif(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `CIF-2026-${num}`;
}

/**
 * Tanggung jawab tunggal: Mengelola state autentikasi client-side (sessionStorage),
 * login akun demo, registrasi nasabah baru, dan navigasi Public Shell.
 */
class AuthService {
  private state: AuthState;
  private registeredUser: RegisteredCredentials | null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.registeredUser = loadFromSession<RegisteredCredentials | null>(
      REGISTERED_USER_KEY,
      null
    );
    const savedSession = loadFromSession<UserProfile | null>(AUTH_SESSION_KEY, null);
    this.state = {
      isAuthenticated: savedSession !== null,
      user: savedSession,
      publicRoute: 'landing',
    };
  }

  public getState(): AuthState {
    return this.state;
  }

  public getCurrentUser(): UserProfile {
    return this.state.user ?? createDemoUser();
  }

  public navigatePublic(route: PublicRoute): void {
    this.state = {
      ...this.state,
      publicRoute: route,
    };
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.notify();
  }

  public loginDemo(): UserProfile {
    const demoUser = createDemoUser();
    this.setAuthenticated(demoUser);
    return demoUser;
  }

  public loginWithCredentials(identifier: string, pin: string): { ok: boolean; error?: string; user?: UserProfile } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanId) {
      return { ok: false, error: 'Masukkan email atau nomor HP Anda.' };
    }
    if (cleanPin.length < 6) {
      return { ok: false, error: 'PIN / Kata sandi minimal 6 karakter.' };
    }

    // Cek apakah cocok dengan akun yang baru didaftarkan di sesi ini
    if (this.registeredUser) {
      const reg = this.registeredUser.profile;
      const matchesReg =
        reg.email.toLowerCase() === cleanId ||
        reg.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '');
      if (matchesReg) {
        if (this.registeredUser.pin !== cleanPin) {
          return { ok: false, error: 'PIN / Kata sandi tidak cocok dengan akun terdaftar.' };
        }
        this.setAuthenticated(reg);
        return { ok: true, user: reg };
      }
    }

    // Fallback simulasi client-side: terima kredensial valid apa pun sebagai sesi demo
    const demo = createDemoUser();
    this.setAuthenticated(demo);
    return { ok: true, user: demo };
  }

  public registerUser(params: {
    fullName: string;
    email: string;
    phone: string;
    nik: string;
    pin: string;
  }): { ok: boolean; error?: string; user?: UserProfile } {
    const fullName = params.fullName.trim();
    const email = params.email.trim();
    const phone = params.phone.trim();
    const nik = params.nik.trim();
    const pin = params.pin.trim();

    if (fullName.length < 3) {
      return { ok: false, error: 'Nama lengkap minimal 3 karakter.' };
    }
    if (!/^\d{16}$/.test(nik)) {
      return { ok: false, error: 'NIK harus terdiri dari 16 digit angka.' };
    }
    if (pin.length < 6) {
      return { ok: false, error: 'PIN / Kata sandi minimal 6 karakter.' };
    }

    const profile: UserProfile = {
      fullName,
      cif: generateCif(),
      nik,
      phone,
      email,
      tier: 'Nasabah Baru Terverifikasi',
      isDemo: false,
    };

    this.registeredUser = { profile, pin };
    saveToSession(REGISTERED_USER_KEY, this.registeredUser);
    this.setAuthenticated(profile);
    return { ok: true, user: profile };
  }

  public logout(): void {
    saveToSession(AUTH_SESSION_KEY, null);
    this.state = {
      isAuthenticated: false,
      user: null,
      publicRoute: 'landing',
    };
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.notify();
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setAuthenticated(user: UserProfile): void {
    saveToSession(AUTH_SESSION_KEY, user);
    this.state = {
      isAuthenticated: true,
      user,
      publicRoute: 'landing',
    };
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const authService = new AuthService();
