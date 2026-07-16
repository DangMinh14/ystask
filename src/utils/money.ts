/** Format a VND amount for the English UI, e.g. 1500000 becomes "₫1,500,000". */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Compact VND for chart axes, e.g. 1500000 becomes "1.5M". */
export function formatVNDCompact(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B`
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`
  if (abs >= 1_000) return `${(amount / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`
  return String(amount)
}
