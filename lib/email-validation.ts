import dns from 'dns/promises'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Allowed email providers (can be toggled via env)
const ALLOWED_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'yandex.com',
  'gmx.com',
]

export async function validateEmail(email: string): Promise<{ valid: boolean; error?: string }> {
  // Basic format check
  if (!EMAIL_REGEX.test(email)) {
    return {
      valid: false,
      error: "The email isn't valid — please use a valid email address.",
    }
  }

  const domain = email.split('@')[1]?.toLowerCase()

  if (!domain) {
    return {
      valid: false,
      error: "The email isn't valid — please use a valid email address.",
    }
  }

  // Check if domain whitelist is enabled (default: true)
  const useWhitelist = process.env.EMAIL_DOMAIN_WHITELIST !== 'false'

  if (useWhitelist && !ALLOWED_DOMAINS.includes(domain)) {
    return {
      valid: false,
      error: "The email isn't valid — please use a valid email address.",
    }
  }

  // Check MX record for deliverability
  try {
    const mxRecords = await dns.resolveMx(domain)
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        error: "The email isn't valid — please use a valid email address.",
      }
    }
  } catch (error) {
    // If MX lookup fails, still allow if domain is in whitelist
    if (useWhitelist && ALLOWED_DOMAINS.includes(domain)) {
      return { valid: true }
    }
    return {
      valid: false,
      error: "The email isn't valid — please use a valid email address.",
    }
  }

  return { valid: true }
}

