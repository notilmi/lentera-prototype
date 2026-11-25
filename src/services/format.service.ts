const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const thousandFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatIDR(amount: number): string {
  return idrFormatter.format(Math.round(amount));
}

export function formatThousandID(amount: number): string {
  const safe = Math.max(0, Number.isFinite(amount) ? Math.round(amount) : 0);
  return thousandFormatter.format(safe);
}

export function parseCurrencyValue(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export function setCurrencyInputValue(input: HTMLInputElement | null, amount: number): void {
  if (!input) return;
  input.value = amount > 0 ? formatThousandID(amount) : '';
}

/**
 * Mengubah seluruh <input data-currency-input> agar otomatis memformat
 * pemisah ribuan (10.000.000) sambil menjaga posisi kursor saat mengetik.
 */
export function bindCurrencyInputs(root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement>('input[data-currency-input]').forEach((input) => {
    if (input.dataset.currencyBound === 'true') return;
    input.dataset.currencyBound = 'true';

    if (input.value.trim() !== '') {
      input.value = formatThousandID(parseCurrencyValue(input.value));
    }

    input.addEventListener('input', () => {
      const selStart = input.selectionStart ?? input.value.length;
      const digitsBeforeCaret = input.value.slice(0, selStart).replace(/\D/g, '').length;
      const rawDigits = input.value.replace(/\D/g, '');

      if (!rawDigits) {
        input.value = '';
        return;
      }

      const formatted = formatThousandID(Number(rawDigits));
      input.value = formatted;

      let seenDigits = 0;
      let nextPos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          seenDigits++;
          if (seenDigits >= digitsBeforeCaret) {
            nextPos = i + 1;
            break;
          }
        }
      }
      if (digitsBeforeCaret === 0) nextPos = 0;
      input.setSelectionRange(nextPos, nextPos);
    });
  });
}

export function formatDateID(date: Date): string {
  return dateFormatter.format(date);
}

export function formatDateTimeID(date: Date): string {
  return dateTimeFormatter.format(date);
}

export function extractInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function addMonthsToDate(baseDate: Date, months: number): Date {
  const next = new Date(baseDate.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}
