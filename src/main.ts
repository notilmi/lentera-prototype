import './styles/tokens.css';
import './styles/base.css';
import './styles/app-shell.css';
import './styles/screens.css';
import './styles/public.css';
import './styles/responsive.css';

import { renderAccountDetailScreen } from './screens/account-detail.screen.ts';
import { renderApplyScreen } from './screens/apply.screen.ts';
import { renderAuthScreen } from './screens/auth.screen.ts';
import { renderHomeScreen } from './screens/home.screen.ts';
import { renderKreditScreen } from './screens/kredit.screen.ts';
import { renderLandingScreen } from './screens/landing.screen.ts';
import { renderProfilScreen } from './screens/profil.screen.ts';
import { renderRiwayatScreen } from './screens/riwayat.screen.ts';
import { renderSimpananScreen } from './screens/simpanan.screen.ts';
import { renderTransaksiScreen } from './screens/transaksi.screen.ts';
import { authService } from './services/auth.service.ts';
import { routerService } from './services/router.service.ts';
import type { AuthState } from './types/auth.ts';
import type { NavigationEntry } from './types/navigation.ts';
import { initAppShellController } from './ui/app-shell.controller.ts';
import { renderLucideIcons } from './ui/icons.ts';
import { modalController } from './ui/modal.controller.ts';

function renderCurrentAppScreen(entry: NavigationEntry): void {
  const outlet = document.getElementById('screen-outlet');
  if (!outlet) return;

  switch (entry.route) {
    case 'home':
      renderHomeScreen(outlet);
      break;
    case 'simpanan':
      renderSimpananScreen(outlet, entry.params);
      break;
    case 'account-detail':
      renderAccountDetailScreen(outlet, entry.params);
      break;
    case 'apply':
      renderApplyScreen(outlet, entry.params);
      break;
    case 'riwayat':
      renderRiwayatScreen(outlet);
      break;
    case 'transaksi':
      renderTransaksiScreen(outlet, entry.params);
      break;
    case 'kredit':
      renderKreditScreen(outlet);
      break;
    case 'profil':
      renderProfilScreen(outlet);
      break;
  }

  renderLucideIcons();
}

function renderShellByAuth(authState: AuthState): void {
  const publicShell = document.getElementById('public-shell');
  const appShell = document.getElementById('app-shell');
  if (!publicShell || !appShell) return;

  if (authState.isAuthenticated) {
    publicShell.classList.add('hidden');
    publicShell.innerHTML = '';
    appShell.classList.remove('hidden');
    renderCurrentAppScreen(routerService.getCurrent());
  } else {
    appShell.classList.add('hidden');
    publicShell.classList.remove('hidden');

    if (authState.publicRoute === 'landing') {
      renderLandingScreen(publicShell);
    } else {
      renderAuthScreen(publicShell, authState.publicRoute);
    }
    renderLucideIcons();
  }
}

/**
 * Bootstrapper utama LENTERA Bank (Public Triage Shell <-> Authenticated M-Banking App Shell).
 */
function bootstrap(): void {
  modalController.init();
  initAppShellController();

  routerService.subscribe((entry) => {
    if (authService.getState().isAuthenticated) {
      renderCurrentAppScreen(entry);
    }
  });

  authService.subscribe((authState) => {
    renderShellByAuth(authState);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
