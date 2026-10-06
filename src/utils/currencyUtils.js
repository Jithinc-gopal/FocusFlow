/**
 * currencyUtils.js
 * Currency helpers for Indian Rupee (₹) formatting.
 */

/**
 * Format a number or string amount as Indian Rupees (₹).
 * Supports standard Indian comma separation (e.g., ₹12,450.00).
 *
 * @param {number|string} amount
 * @param {Object} options
 * @param {number} [options.fractionDigits=2]
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, options = {}) {
  const fractionDigits = options.fractionDigits ?? 2
  const num = typeof amount === 'number' ? amount : parseFloat(amount)

  if (isNaN(num)) {
    return '₹0.00'
  }

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  return `₹${formatted}`
}
