import { getRoomKey } from "./storage";

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++){
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++){
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateRandomRoomKey() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(salt) {
  const keyString = getRoomKey();
  if (!keyString) throw new Error('No room encryption key found');

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(keyString),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(plainText) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);

  const enc = new TextEncoder();
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  return JSON.stringify({
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  });
}

export async function decryptText(encryptedJsonStr) {
  try {
    const { ciphertext, iv, salt } = JSON.parse(encryptedJsonStr);
    const saltBuf = base64ToBuffer(salt);
    const ivBuf = base64ToBuffer(iv);
    const cipherBuf = base64ToBuffer(ciphertext);

    const key = await deriveKey(new Uint8Array(saltBuf));
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuf) },
      key,
      cipherBuf
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return '[Encrypted content - key mismatch]';
  }
}

export async function encryptFileBlob(file) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);

  const fileBuffer = await file.arrayBuffer();
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  return new Blob([salt, iv, cipherBuffer], { type: 'application/octet-stream' });
}

export async function decryptFileFromUrl(url, originalMimeType = 'application/octet-stream') {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download encrypted file');

  const packedBuffer = await res.arrayBuffer();
  if (packedBuffer.byteLength < 28) {
    throw new Error('Corrupted or unencrypted file buffer');
  }
  const salt = new Uint8Array(packedBuffer.slice(0, 16));
  const iv = new Uint8Array(packedBuffer.slice(16, 28));
  const cipherBuffer = packedBuffer.slice(28);

  const key = await deriveKey(salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    cipherBuffer
  );

  return new Blob([decryptedBuffer], { type: originalMimeType });
}
