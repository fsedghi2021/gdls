import type { LedgerRecord } from '../types/gdls'

const encoder = new TextEncoder()

export const sha256 = async (input: string): Promise<string> => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is unavailable for SHA-256 demonstration hashing.')
  }

  const bytes = encoder.encode(input)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const buildRecordHashInput = (
  record: Omit<LedgerRecord, 'currentRecordHash'>,
): string => {
  return JSON.stringify(record)
}
