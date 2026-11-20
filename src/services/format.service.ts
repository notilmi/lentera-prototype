const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
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
