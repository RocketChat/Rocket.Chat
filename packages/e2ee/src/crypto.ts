const RSA_ALGORITHM = {
	name: 'RSA-OAEP',
	modulusLength: 2048,
	publicExponent: new Uint8Array([1, 0, 1]),
	hash: 'SHA-256',
} as const satisfies RsaHashedKeyGenParams;

const AES_ALGORITHM = { name: 'AES-GCM', length: 256 } as const satisfies AesKeyGenParams;

const PBKDF2_PARAMS = {
	name: 'PBKDF2',
	hash: 'SHA-256',
	iterations: 100_000,
} as const satisfies Omit<Pbkdf2Params, 'salt'>;

/**
 * Encodes an ArrayBuffer into a Base64 string.
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(buffer)));

/**
 * Decodes a Base64 string into an ArrayBuffer.
 */
const base64ToArrayBuffer = (base64: string): Uint8Array<ArrayBuffer> => {
	const binary_string = atob(base64);
	const len = binary_string.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes;
};

/**
 * Generates a new RSA-OAEP key pair for asymmetric encryption.
 */
export const rsaGenerateKeyPair = async (): Promise<CryptoKeyPair> => {
	const keyPair = await crypto.subtle.generateKey(RSA_ALGORITHM, true, ['encrypt', 'decrypt']);
	return keyPair;
};

/**
 * Generates a new AES-GCM key for symmetric encryption.
 */
export const generateAesKey = async (): Promise<CryptoKey> => {
	const key = await crypto.subtle.generateKey(AES_ALGORITHM, true, ['encrypt', 'decrypt']);
	return key;
};

/**
 * Derives an AES-GCM key from a passphrase using PBKDF2.
 * @param passphrase The user's secret passphrase.
 * @param salt A unique salt for the key derivation.
 */
export const deriveKeyFromPassphrase = async (passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> => {
	const masterKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);

	const key = await crypto.subtle.deriveKey({ ...PBKDF2_PARAMS, salt }, masterKey, { name: 'AES-GCM', length: 256 }, true, [
		'encrypt',
		'decrypt',
	]);

	return key;
};

/**
 * A bundle containing the user's encrypted private key and the necessary metadata for decryption.
 * This should be stored securely on a server for account recovery.
 */
export interface EncryptedPrivateKeyBundle {
	salt: string; // Base64
	iv: string; // Base64
	ciphertext: string; // Base64
	pbkdf2Iterations: number;
	hashAlgorithm: 'SHA-256';
	encryptionAlgorithm: 'AES-GCM';
}

/**
 * Decrypts a user's private key using their passphrase.
 * @param bundle The bundle containing the encrypted key and metadata.
 * @param passphrase The user's passphrase.
 */
export const recoverPrivateKeyFromBundle = async (bundle: EncryptedPrivateKeyBundle, passphrase: string): Promise<CryptoKey> => {
	const salt = base64ToArrayBuffer(bundle.salt);
	const iv = base64ToArrayBuffer(bundle.iv);
	const ciphertext = base64ToArrayBuffer(bundle.ciphertext);

	const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
	const decryptedKeyData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, derivedKey, ciphertext);

	const privateKey = await crypto.subtle.importKey('pkcs8', decryptedKeyData, RSA_ALGORITHM, true, ['decrypt']);

	return privateKey;
};

/**
 * Encrypts data with an RSA public key.
 * Used for wrapping the group's symmetric key.
 */
export const rsaEncrypt = async (groupKey: CryptoKey, publicKey: CryptoKey): Promise<string> => {
	const rawKey = await crypto.subtle.exportKey('raw', groupKey);
	const encrypted = await crypto.subtle.encrypt(RSA_ALGORITHM, publicKey, rawKey);
	return arrayBufferToBase64(encrypted);
};

/**
 * Decrypts data with an RSA private key.
 * Used for unwrapping the group's symmetric key.
 */
export const rsaDecrypt = async (encryptedKeyBase64: string, privateKey: CryptoKey): Promise<CryptoKey> => {
	const encryptedKey = base64ToArrayBuffer(encryptedKeyBase64);
	const decryptedRawKey = await crypto.subtle.decrypt(RSA_ALGORITHM, privateKey, encryptedKey);
	const importedKey = await crypto.subtle.importKey('raw', decryptedRawKey, AES_ALGORITHM, true, ['encrypt', 'decrypt']);
	return importedKey;
};

/**
 * Represents the structure of an encrypted message ready for transmission.
 */
export interface EncryptedMessage {
	ciphertext: string; // Base64 encoded
	iv: string; // Base64 encoded
}

/**
 * Encrypts a message using a symmetric AES-GCM key.
 */
export const aesEncrypt = async (plaintext: string, key: CryptoKey): Promise<EncryptedMessage> => {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encodedPlaintext = new TextEncoder().encode(plaintext);

	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedPlaintext);

	return {
		ciphertext: arrayBufferToBase64(ciphertext),
		iv: arrayBufferToBase64(iv.buffer),
	};
};

/**
 * Decrypts a message using a symmetric AES-GCM key.
 */
export const aesDecrypt = async (encryptedMessage: EncryptedMessage, key: CryptoKey): Promise<string> => {
	const ciphertext = base64ToArrayBuffer(encryptedMessage.ciphertext);
	const iv = base64ToArrayBuffer(encryptedMessage.iv);

	const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

	return new TextDecoder().decode(decryptedBuffer);
};

export interface PublicKeyInfo {
	format: 'jwk';
	keyData: JsonWebKey;
	algorithm: RsaHashedImportParams;
}

export const importPublicKey = async (keyInfo: PublicKeyInfo): Promise<CryptoKey> => {
	const publicKey = await crypto.subtle.importKey(keyInfo.format, keyInfo.keyData, keyInfo.algorithm, true, ['encrypt']);
	return publicKey;
};

export const exportPublicKeyInfo = async (key: CryptoKey): Promise<PublicKeyInfo> => {
	const jwk = await crypto.subtle.exportKey('jwk', key);
	return {
		format: 'jwk',
		keyData: jwk,
		algorithm: { name: 'RSA-OAEP', hash: 'SHA-256' },
	};
};

export const createEncryptedPrivateKeyBundle = async (privateKey: CryptoKey, passphrase: string): Promise<EncryptedPrivateKeyBundle> => {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));

	const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
	const exportedPrivateKey = await crypto.subtle.exportKey('pkcs8', privateKey);

	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, exportedPrivateKey);

	return {
		salt: arrayBufferToBase64(salt.buffer),
		iv: arrayBufferToBase64(iv.buffer),
		ciphertext: arrayBufferToBase64(ciphertext),
		pbkdf2Iterations: PBKDF2_PARAMS.iterations,
		hashAlgorithm: PBKDF2_PARAMS.hash,
		encryptionAlgorithm: 'AES-GCM',
	};
};
