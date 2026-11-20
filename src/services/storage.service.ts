/**
 * Tanggung jawab tunggal: Membaca dan menyimpan state prototype ke sessionStorage secara aman.
 */
export function loadFromSession<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToSession<T>(key: string, value: T): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Abaikan jika storage tidak tersedia (private mode / quota penuh)
  }
}

export function clearSessionKeys(keys: readonly string[]): void {
  try {
    for (const key of keys) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Abaikan jika storage tidak tersedia
  }
}
