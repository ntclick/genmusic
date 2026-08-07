/**
 * Format a number for compact display.
 *   0        → ''  (empty — caller should hide)
 *   1-999    → '123'
 *   1000-9999 → '1.2k'
 *   10000+   → '12k', '125k', '1.2M'
 */
export function formatCount(n: number): string {
  if (!n || n <= 0) return ''
  if (n < 1000) return n.toString()
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  if (n < 1000000) return Math.floor(n / 1000) + 'k'
  return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
}
