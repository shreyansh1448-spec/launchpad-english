// Web Crypto helpers replacing Node's `crypto` module and `bcryptjs`, for use
// inside Cloudflare Pages Functions (Workers runtime).

// OWASP recommends 210000 for PBKDF2-SHA256 as of 2023+, but Cloudflare
// Workers' production crypto.subtle implementation hard-caps PBKDF2 at
// 100000 iterations (this is enforced only in the real workerd runtime, not
// in local Miniflare emulation, which is why this can look fine in `wrangler
// pages dev` and then fail with "iteration counts above 100000 are not
// supported" once actually deployed) - so 100000 is the effective ceiling.
const PBKDF2_ITERATIONS = 100000;
const encoder = new TextEncoder();

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bufToHex(bytes.buffer);
}

async function sha256Hex(message) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(message));
  return bufToHex(digest);
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return bufToHex(signature);
}

// Timing-safe-ish comparison for hex digest strings (equal length, so a
// simple loop is constant-time with respect to content).
function hexEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// PBKDF2-SHA256 password hashing, replacing bcrypt. Returns { hash, salt },
// both hex-encoded, to be stored in admins.password_hash / admins.password_salt.
async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16)).buffer;
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return { hash: bufToHex(bits), salt: bufToHex(salt) };
}

async function verifyPassword(password, hashHex, saltHex) {
  const { hash } = await hashPassword(password, saltHex);
  return hexEquals(hash, hashHex);
}

export { bufToHex, hexToBuf, randomHex, sha256Hex, hmacSha256Hex, hexEquals, hashPassword, verifyPassword };
