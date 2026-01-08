// Client-side encryption utilities
// Note: For production, use server-side encryption with proper key management

export function maskText(text: string, visibleChars: number = 4): string {
  if (!text || text.length <= visibleChars) return '•'.repeat(8)
  const visible = text.substring(0, visibleChars)
  const masked = '•'.repeat(Math.max(8, text.length - visibleChars))
  return visible + masked
}

// Validate UPI ID format
export function validateUPI(upi: string): boolean {
  if (!upi) return false
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
  return upiRegex.test(upi)
}

// Validate phone number (Indian format)
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

