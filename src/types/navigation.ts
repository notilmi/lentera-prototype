import type { ProductKind } from './account.ts';

export type MainTabRoute =
  | 'home'
  | 'simpanan'
  | 'transaksi'
  | 'kredit'
  | 'riwayat'
  | 'profil';

export type SubScreenRoute = 'account-detail' | 'apply';

export type ScreenRoute = MainTabRoute | SubScreenRoute;

export type SimpananSubTab = 'accounts' | 'catalog' | 'calculator';

export type TransaksiMode = 'transfer' | 'qris' | 'tagihan' | 'ewallet';

export interface RouteParams {
  simpananTab?: SimpananSubTab;
  txMode?: TransaksiMode;
  accountId?: string;
  product?: ProductKind;
  prefillAmount?: number;
  prefillTenor?: number;
}

export interface NavigationEntry {
  route: ScreenRoute;
  params?: RouteParams;
}
