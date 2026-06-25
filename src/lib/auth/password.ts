import crypto from 'crypto'

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const newHash = hashPassword(password, salt)
  return newHash === hash
}
