const TZ = 'Asia/Jakarta';

export function nowIsoJakarta() {
  // Keep as ISO string (UTC) but formatting always in Jakarta timezone.
  return new Date().toISOString();
}

export function formatDateId(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: TZ
  }).format(d);
}

export function formatDateTimeId(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ
  }).format(d);
}

export function isoFromDateInput(v: string) {
  // expects yyyy-mm-dd
  const [y, m, day] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day, 0, 0, 0));
  return dt.toISOString();
}

export function todayInputValueJakarta() {
  // Return yyyy-mm-dd based on Jakarta date
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date());
}
