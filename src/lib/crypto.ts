import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(salt: Buffer): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha512');
}

export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return salt.toString('hex') + iv.toString('hex') + encrypted + tag.toString('hex');
}

export function decrypt(encrypted: string): string {
  const salt = Buffer.from(encrypted.slice(0, SALT_LENGTH * 2), 'hex');
  const iv = Buffer.from(encrypted.slice(SALT_LENGTH * 2, SALT_LENGTH * 2 + IV_LENGTH * 2), 'hex');
  const tag = Buffer.from(encrypted.slice(-TAG_LENGTH * 2), 'hex');
  const encryptedText = encrypted.slice(SALT_LENGTH * 2 + IV_LENGTH * 2, -TAG_LENGTH * 2);

  const key = getKey(salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
