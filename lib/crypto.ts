import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT = 'velobrand-studio-provider-keys';

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and set it in your environment.',
    );
  }
  // Derive a 32-byte key regardless of the raw secret's length/format.
  return scryptSync(secret, SALT, 32);
}

/** Encrypts a plaintext provider API key for storage in provider_keys.encrypted_key. */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return ['v1', iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':');
}

/** Decrypts a value produced by encryptSecret. Server-only — never call from client code. */
export function decryptSecret(stored: string): string {
  const [version, ivB64, authTagB64, ciphertextB64] = stored.split(':');
  if (version !== 'v1' || !ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Unrecognized encrypted secret format');
  }

  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
