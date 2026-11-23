import { formatIDR } from '../services/format.service.ts';
import { ledgerService } from '../services/ledger.service.ts';
import type { LedgerCategory } from '../types/transaction.ts';
import { renderLucideIcons } from '../ui/icons.ts';

let activeFilter: 'all' | LedgerCategory = 'all';
let searchQuery = '';

/**
 * Tanggung jawab tunggal: Merender layar Riwayat Mutasi dengan filter produk & pencarian.
 */
export function renderRiwayatScreen(container: HTMLElement): void {
  const draw = (): void => {
    const allEntries = ledgerService.getEntries();
    const filtered = allEntries.filter((entry) => {
      const matchKind = activeFilter === 'all' || entry.productKind === activeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q.length === 0 ||
        entry.description.toLowerCase().includes(q) ||
        entry.accountNumber.toLowerCase().includes(q);
      return matchKind && matchSearch;
    });

    container.innerHTML = `
      <div class="screen-stack">
        <div class="riwayat-controls">
          <div class="search-input-wrap">
            <i data-lucide="search" width="16" height="16"></i>
            <input
              type="search"
              id="riwayat-search"
              class="input-control search-control"
              placeholder="Cari keterangan atau nomor rekening..."
              value="${searchQuery}"
            />
          </div>

          <div class="filter-chip-row">
            ${(['all', 'tabungan', 'deposito', 'giro', 'transaksi', 'kredit'] as const)
              .map((key) => {
                const labels: Record<'all' | LedgerCategory, string> = {
                  all: 'Semua',
                  tabungan: 'Tabungan',
                  deposito: 'Deposito',
                  giro: 'Giro',
                  transaksi: 'Transaksi',
                  kredit: 'Kredit',
                };
                return `<button type="button" class="filter-chip ${activeFilter === key ? 'active' : ''}" data-tx-filter="${key}">${labels[key]}</button>`;
              })
              .join('')}
          </div>
        </div>

        <div class="surface-plate">
          ${
            filtered.length > 0
              ? `<ul class="activity-list">
                  ${filtered
                    .map((tx) => {
                      const isDebit = tx.type === 'DEBIT';
                      return `
                      <li class="activity-row">
                        <div class="activity-left">
                          <span class="activity-icon ${isDebit ? 'is-debit' : ''}"><i data-lucide="${isDebit ? 'arrow-up-right' : 'arrow-down-left'}" width="16" height="16"></i></span>
                          <div>
                            <strong class="activity-title">${tx.description}</strong>
                            <span class="activity-sub">${tx.accountNumber} • ${tx.timestamp}</span>
                          </div>
                        </div>
                        <span class="activity-amount ${isDebit ? 'is-debit' : 'is-credit'}">${isDebit ? '-' : '+'} ${formatIDR(tx.amount)}</span>
                      </li>
                    `;
                    })
                    .join('')}
                </ul>`
              : `<div class="empty-inline">
                  <i data-lucide="inbox" width="28" height="28"></i>
                  <p>Tidak ada mutasi yang cocok dengan filter Anda.</p>
                </div>`
          }
        </div>
      </div>
    `;

    const searchEl = document.getElementById('riwayat-search') as HTMLInputElement | null;
    searchEl?.addEventListener('input', () => {
      searchQuery = searchEl.value;
      draw();
      const restored = document.getElementById('riwayat-search') as HTMLInputElement | null;
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });

    container.querySelectorAll<HTMLButtonElement>('[data-tx-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.txFilter as 'all' | LedgerCategory;
        draw();
      });
    });

    renderLucideIcons();
  };

  draw();
}
