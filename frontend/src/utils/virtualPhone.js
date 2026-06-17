/**
 * Generates a deterministic virtual phone number from an order ID.
 * The number printed on shipping labels — not the customer's real number.
 * Format: 0287-AAABBB where AAA = padded orderId, BBB = (orderId*17+42) % 1000
 */
export function virtualPhone(orderId) {
  return `0287-${String(orderId).padStart(3, '0')}${String((orderId * 17 + 42) % 1000).padStart(3, '0')}`;
}
