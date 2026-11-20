export type PublicRoute = 'landing' | 'login' | 'register';

export interface UserProfile {
  fullName: string;
  cif: string;
  nik: string;
  phone: string;
  email: string;
  tier: string;
  isDemo: boolean;
}

export interface RegisteredCredentials {
  profile: UserProfile;
  pin: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  publicRoute: PublicRoute;
}
