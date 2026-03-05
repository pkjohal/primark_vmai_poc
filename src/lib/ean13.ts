/**
 * Validates an EAN-13 barcode string.
 * Returns true if the string is exactly 13 digits and the check digit is correct.
 */
export function validateEAN13(ean: string): boolean {
  if (!/^\d{13}$/.test(ean)) return false;
  const digits = ean.split('').map(Number);
  const sum = digits
    .slice(0, 12)
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
}
