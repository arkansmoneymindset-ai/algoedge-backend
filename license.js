const crypto = require('crypto');

/**
 * Generate a unique license key
 * Format: AE-XXXX-XXXX-XXXX-XXXX
 */
function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `AE-${segments.join('-')}`;
}

/**
 * Generate a secure order ID
 * Format: ORD-TIMESTAMP-RANDOM
 */
function generateOrderId() {
  const ts     = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${ts}-${random}`;
}

/**
 * Verify a license key format
 */
function isValidLicenseFormat(key) {
  return /^AE-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(key);
}

module.exports = { generateLicenseKey, generateOrderId, isValidLicenseFormat };
