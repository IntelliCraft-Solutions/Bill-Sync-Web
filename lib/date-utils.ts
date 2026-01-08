/**
 * Date utility functions for IST (Asia/Kolkata) timezone
 * IST is UTC+5:30
 */

/**
 * Get current date/time in IST (Asia/Kolkata)
 * @returns Date object representing current IST time
 */
export function getISTDate(): Date {
  const now = new Date()
  // IST is UTC+5:30 = 5.5 hours = 5.5 * 60 * 60 * 1000 milliseconds
  const istOffset = 5.5 * 60 * 60 * 1000
  const istTime = new Date(now.getTime() + istOffset)
  return istTime
}

/**
 * Get IST date string in ISO format
 * @returns ISO string of current IST time
 */
export function getISTDateString(): string {
  return getISTDate().toISOString()
}

/**
 * Add days to IST date
 * @param days Number of days to add
 * @returns Date object
 */
export function addDaysToIST(days: number): Date {
  const istNow = getISTDate()
  return new Date(istNow.getTime() + days * 24 * 60 * 60 * 1000)
}
