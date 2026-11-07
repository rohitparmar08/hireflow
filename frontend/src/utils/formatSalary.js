const SYMBOLS = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };

// "₹600,000 - ₹1,200,000 INR" instead of always prefixing a dollar sign.
export function formatSalaryRange(min, max, currency = 'USD') {
  const code = (currency || 'USD').toUpperCase();
  const symbol = SYMBOLS[code] || '';
  const fmt = (n) => `${symbol}${Number(n).toLocaleString()}`;
  return `${fmt(min)} - ${fmt(max)} ${code}`;
}
