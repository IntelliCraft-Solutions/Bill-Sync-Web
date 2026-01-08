import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash OTP for storage
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10)
}

/**
 * Verify OTP
 */
export async function verifyOTP(otp: string, hashedOTP: string): Promise<boolean> {
  return bcrypt.compare(otp, hashedOTP)
}

/**
 * Generate OTP expiry (10 minutes from now)
 */
export function getOTPExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 10)
  return expiry
}

