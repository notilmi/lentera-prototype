import type {
  MainTabRoute,
  NavigationEntry,
  RouteParams,
  ScreenRoute,
} from '../types/navigation.ts';

type RouteListener = (current: NavigationEntry, canGoBack: boolean) => void;

const MAIN_TABS: ReadonlySet<ScreenRoute> = new Set<MainTabRoute>([
  'home',
  'simpanan',
  'transaksi',
  'kredit',
  'riwayat',
  'profil',
]);

/**
 * Tanggung jawab tunggal: Mengelola state layar aktif SPA m-banking
 * serta tumpukan navigasi (history stack) untuk tombol "← Kembali".
 */
class RouterService {
  private stack: NavigationEntry[] = [{ route: 'home' }];
  private listeners: Set<RouteListener> = new Set();

  public getCurrent(): NavigationEntry {
    return this.stack[this.stack.length - 1];
  }

  public getActiveMainTab(): MainTabRoute {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const route = this.stack[i].route;
      if (MAIN_TABS.has(route)) {
        return route as MainTabRoute;
      }
    }
    return 'home';
  }

  public canGoBack(): boolean {
    return this.stack.length > 1;
  }

  public navigate(route: ScreenRoute, params?: RouteParams): void {
    if (MAIN_TABS.has(route)) {
      this.stack = [{ route, params }];
    } else {
      this.stack = [...this.stack, { route, params }];
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.notify();
  }

  public back(): void {
    if (this.stack.length > 1) {
      this.stack = this.stack.slice(0, -1);
      window.scrollTo({ top: 0, behavior: 'instant' });
      this.notify();
    } else {
      this.navigate('home');
    }
  }

  public subscribe(listener: RouteListener): () => void {
    this.listeners.add(listener);
    listener(this.getCurrent(), this.canGoBack());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const current = this.getCurrent();
    const canBack = this.canGoBack();
    for (const listener of this.listeners) {
      listener(current, canBack);
    }
  }
}

export const routerService = new RouterService();
