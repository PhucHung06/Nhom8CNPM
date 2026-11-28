export function formatVnd(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '0 đ';
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num)} đ`;
}

export function formatNumber(value, maxFractionDigits = 2) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: maxFractionDigits }).format(num);
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCurrentBillingPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
