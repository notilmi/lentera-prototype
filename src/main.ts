import './styles/tokens.css';
import './styles/base.css';
import './styles/app-shell.css';
import './styles/screens.css';
import './styles/responsive.css';

import { renderAccountDetailScreen } from './screens/account-detail.screen.ts';
import { renderApplyScreen } from './screens/apply.screen.ts';
import { renderHomeScreen } from './screens/home.screen.ts';
import { renderKreditScreen } from './screens/kredit.screen.ts';
import { renderProfilScreen } from './screens/profil.screen.ts';
import { renderRiwayatScreen } from './screens/riwayat.screen.ts';
import { renderSimpananScreen } from './screens/simpanan.screen.ts';
import { renderTransaksiScreen } from './screens/transaksi.screen.ts';
import { routerService } from './services/router.service.ts';
import type { NavigationEntry } from './types/navigation.ts';
import { initAppShellController } from './ui/app-shell.controller.ts';
import { renderLucideIcons } from './ui/icons.ts';
import { modalController } from './ui/modal.controller.ts';

function renderCurrentScreen(entry: NavigationEntry): void {
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
      renderTransaksiScreen(outlet);
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

/**
 * Bootstrapper utama SPA M-Banking LENTERA Bank.
 */
function bootstrap(): void {
  modalController.init();
  initAppShellController();
  routerService.subscribe((entry) => renderCurrentScreen(entry));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
