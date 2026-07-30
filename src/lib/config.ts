// ===== Mathemzi Edu — Site-wide Configuration =====
// Edit this file to update social links, contact info, and branding.

export const SITE_CONFIG = {
  name: 'Mathemzi Edu',
  shortName: 'Mathemzi',
  tagline: 'Master Mathematics with Logic, Practice & Confidence',
  banglaTagline: 'গণিত হোক সহজ, যুক্তিতে হোক শক্তিশালী',
  description: 'A premium Bangladesh-focused mathematics learning ecosystem for school students, O Level/A Level learners, olympiad aspirants, and admission candidates. Structured courses, practice exams, books, progress tracking, and expert-guided learning.',
  url: (import.meta.env.VITE_SITE_URL || 'https://mathemziedu.vercel.app').replace(/\/$/, ''),
  email: 'support@mathemziedu.com',
  phone: '+880 1700 000000',
  address: 'Dhaka, Bangladesh',
  supportHours: 'Saturday – Thursday, 10:00 AM – 8:00 PM (BST)',
};

export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/mathemziedu',
  twitter: 'https://twitter.com/mathemziedu',
  instagram: 'https://instagram.com/mathemziedu',
  youtube: 'https://youtube.com/@mathemziedu',
};

export const CONTACT_INFO = {
  email: SITE_CONFIG.email,
  phone: SITE_CONFIG.phone,
  address: SITE_CONFIG.address,
};

// Legacy admin email — used as fallback if Firestore role isn't set
export const LEGACY_ADMIN_EMAILS = new Set(['sarkerramjan2015@gmail.com']);

// ===== Payment Gateway Configuration =====
// Each provider is a placeholder. Replace the values with real credentials
// when the backend is ready. Do NOT commit real API keys to the repository.

export const PAYMENT_PROVIDERS = {
  sslcommerz: {
    name: 'SSLCommerz',
    active: false,
    // Backend endpoint to initiate SSLCommerz session — implement in Firebase Function or server
    initiateUrl: '/api/payments/sslcommerz/initiate',
    // Replace with real store ID in production .env file
    storeId: 'YOUR_SSLCOMMERZ_STORE_ID',
  },
  bkash: {
    name: 'bKash Merchant',
    active: false,
    initiateUrl: '/api/payments/bkash/initiate',
  },
  nagad: {
    name: 'Nagad',
    active: false,
    initiateUrl: '/api/payments/nagad/initiate',
  },
  shurjopay: {
    name: 'ShurjoPay',
    active: false,
    initiateUrl: '/api/payments/shurjopay/initiate',
  },
};

/**
 * Returns the active payment providers (those with active: true).
 * In this phase all are inactive. Activate by setting active: true
 * once the backend integration is ready.
 */
export function getActivePaymentProviders() {
  return Object.entries(PAYMENT_PROVIDERS)
    .filter(([, config]) => config.active)
    .map(([key, config]) => ({ key, ...config }));
}

// ===== Manual bKash Payment Configuration =====
// Used for manual payment verification flow until SSLCommerz is integrated.
// Replace with real bKash merchant number when available.

export const BKASH_MANUAL = {
  number: '01XXXXXXXXX',
  accountType: 'Merchant',
  instructions: [
    'Go to your bKash app and select "Send Money".',
    'Enter our bKash number shown above.',
    'Enter the exact payable amount from your order.',
    'Write your Order ID in the reference field (recommended).',
    'Enter your bKash PIN and confirm the payment.',
    'Copy the Transaction ID (TrxID) from the bKash confirmation message.',
    'Return to this page and submit your Transaction ID and bKash number below.',
  ],
  supportContact: 'support@mathemziedu.com',
  note: 'Please send the payable amount to our bKash number. After payment, submit your bKash Transaction ID from your dashboard or payment section. Our admin team will verify the payment manually. Access will be activated after verification.',
};
