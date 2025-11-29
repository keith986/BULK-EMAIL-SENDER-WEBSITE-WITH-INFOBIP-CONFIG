// Client-side password hashing helper using Web Crypto (PBKDF2 + SHA-256)
// Returns an object with { salt, iterations, hash } where salt and hash are base64 strings

/*
const encoder = (s: string) => new TextEncoder().encode(s);
const toBase64 = (b: ArrayBuffer) => {
  const bytes = new Uint8Array(b);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return globalThis.btoa(binary);
};

export async function hashPassword(password: string, iterations = 100_000) {
  if (!password) throw new Error('empty password');
  // generate a random 16 byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // import the password as a key
  const keyMaterial = await crypto.subtle.importKey('raw', encoder(password), 'PBKDF2', false, ['deriveBits']);

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );

  return {
    salt: toBase64(salt.buffer),
    iterations,
    hash: toBase64(derivedBits),
    algorithm: 'PBKDF2-SHA256'
  };
}

// Verify a password against a stored hashedPassword object produced by hashPassword
export async function verifyPassword(password: string, stored: { salt: string, iterations: number, hash: string, algorithm?: string }) {
  if (!stored || !stored.salt || !stored.hash) return false;
  const saltBytes = Uint8Array.from(atob(stored.salt), c => c.charCodeAt(0)).buffer;

  // import key material
  const keyMaterial = await crypto.subtle.importKey('raw', encoder(password), 'PBKDF2', false, ['deriveBits']);

  const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(saltBytes), iterations: stored.iterations ?? 100_000, hash: 'SHA-256' }, keyMaterial, 256);

  const derivedBase64 = toBase64(derivedBits);
  // timing-safe compare is better, but here simple equality is used
  return derivedBase64 === stored.hash;
}
*/

import { createHash, randomBytes } from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  // For server-side, use Node.js crypto
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(salt + password)  // salt FIRST
    .digest('hex');
  
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const [salt, hash] = hashedPassword.split(':');
    
    if (!salt || !hash) {
      return false;
    }
    
    const newHash = createHash('sha256')
      .update(salt + password)  // salt FIRST (must match hashPassword)
      .digest('hex');
    
    return hash === newHash;
  } catch (error) {
    console.error('verifyPassword error:', error);
    return false;
  }
}