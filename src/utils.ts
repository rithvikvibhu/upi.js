import assert from 'node:assert';
import crypto from 'node:crypto';
import forge from 'node-forge';

/**
 * Validate VPA
 */
export function isVPA(vpa: VPA): vpa is VPA {
  if (!vpa?.length) return false;
  const atAt = vpa.indexOf('@');
  if (atAt === -1 || atAt === 0 || atAt === vpa.length - 1) return false;
  return true;
}

/**
 * Validate Amount
 */
export function isAmount(amount: Amount): amount is Amount {
  if (!amount?.value || !amount?.currency) return false;
  if (!/\d+\.\d{2}/gi.test(amount.value)) return false;
  return true;
}

export function sha256(data: Buffer) {
  return crypto.createHash('sha256').update(data).digest();
}

/**
 * Encrypt with AES-GCM-128
 */
export function aesGcm128Encrypt(data: Buffer, key: Buffer, iv: Buffer) {
  const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([encrypted, authTag]);
}

/**
 * Encrypt with AES-GCM-256
 */
export function aesGcm256Encrypt(data: Buffer, key: Buffer, iv: Buffer) {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([encrypted, authTag]);
}

/**
 * Encrypt with RSA-OAEP
 */
export function rsaEncryptForPubKey(data: string, pubKey: Buffer) {
  const publicKey = forge.pki.publicKeyFromPem(
    '-----BEGIN PUBLIC KEY-----' +
      pubKey.toString('base64') +
      '-----END PUBLIC KEY-----'
  );

  // RSA/ECB/OAEPwithSHA-256andMGF1Padding
  const encrypted = publicKey.encrypt(forge.util.encodeUtf8(data), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
  });

  return Buffer.from(encrypted, 'latin1');
}

/**
 * Encrypt with RSA-OAEP
 */
export function rsaEncryptForCertificate(data: string, cert: string) {
  assert.ok(
    typeof cert === 'string' && cert.startsWith('-----BEGIN CERTIFICATE-----'),
    'Invalid PEM certificate.'
  );

  const publicKey = forge.pki.certificateFromPem(cert)
    .publicKey as forge.pki.rsa.PublicKey;

  // RSA/ECB/OAEPwithSHA-256andMGF1Padding
  const encrypted = publicKey.encrypt(forge.util.encodeUtf8(data), 'RSA-OAEP', {
    md: forge.md.sha256.create(),
  });

  return Buffer.from(encrypted, 'latin1');
}
