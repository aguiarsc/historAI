import { loadApiKey as dbLoadApiKey, saveApiKey as dbSaveApiKey } from '../../../services/storage/secureStorage';
import { STORES, getValue, setValue } from '../../../services/storage/db';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const ITERATIONS = 100000;
const DEVICE_ID_KEY = 'device-id';
const ENCRYPTION_SALT_KEY = 'encryption-salt';

/**
 * Retrieves or generates a unique device ID for encryption.
 * @returns {Promise<string>}
 */
async function getDeviceId(): Promise<string> {
  let deviceId = await getValue<string>(STORES.SECURE_STORAGE, DEVICE_ID_KEY);
  
  if (!deviceId) {
    const randomArray = new Uint8Array(16);
    window.crypto.getRandomValues(randomArray);
    deviceId = Array.from(randomArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    await setValue(STORES.SECURE_STORAGE, DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Retrieves or generates a salt value for encryption key derivation.
 * @returns {Promise<Uint8Array>}
 */
async function getSalt(): Promise<Uint8Array> {
  let saltHex = await getValue<string>(STORES.SECURE_STORAGE, ENCRYPTION_SALT_KEY);
  
  if (!saltHex) {
    const salt = new Uint8Array(16);
    window.crypto.getRandomValues(salt);
    saltHex = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    await setValue(STORES.SECURE_STORAGE, ENCRYPTION_SALT_KEY, saltHex);
    return salt;
  }
  
  return new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
  );
}

/**
 * Derives an AES-GCM encryption key from the device ID and salt.
 * @returns {Promise<CryptoKey>}
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const deviceId = await getDeviceId();
  const salt = await getSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(deviceId),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string using AES-GCM and returns a base64 payload.
 * @param {string} data
 * @returns {Promise<string>}
 */
async function encryptData(data: string): Promise<string> {
  if (!data) return '';
  
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getEncryptionKey();
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      dataBuffer
    );
    
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedBuffer), iv.length);
    
    return btoa(String.fromCharCode(...result));
  } catch (e) {
    console.error('Encryption error:', e);
    return '';
  }
}

/**
 * Decrypts a base64-encoded AES-GCM payload back to a string.
 * @param {string} encryptedData
 * @returns {Promise<string>}
 */
async function decryptData(encryptedData: string): Promise<string> {
  if (!encryptedData) return '';
  
  try {
    const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);
    
    const key = await getEncryptionKey();
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (e) {
    console.error('Decryption error:', e);
    return '';
  }
}

/**
 * Encrypts and saves the API key to secure storage.
 * @param {string} apiKey
 * @returns {Promise<void>}
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  try {
    const encryptedKey = await encryptData(apiKey);
    await dbSaveApiKey(encryptedKey);
  } catch (e) {
    console.error('Error saving API key:', e);
  }
}

/**
 * Loads and decrypts the API key from secure storage.
 * @returns {Promise<string>}
 */
export async function loadApiKey(): Promise<string> {
  try {
    const encryptedKey = await dbLoadApiKey();
    if (!encryptedKey) return '';
    
    return await decryptData(encryptedKey);
  } catch (e) {
    console.error('Error loading API key:', e);
    return '';
  }
}
