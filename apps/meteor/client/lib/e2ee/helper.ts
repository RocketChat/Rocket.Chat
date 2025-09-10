import ByteBuffer from 'bytebuffer';

export function toString(thing: any) {
	if (typeof thing === 'string') {
		return thing;
	}

	return ByteBuffer.wrap(thing).toString('binary');
}

export function toArrayBuffer(thing: any) {
	if (thing === undefined) {
		return undefined;
	}
	if (typeof thing === 'object') {
		if (Object.getPrototypeOf(thing) === ArrayBuffer.prototype) {
			return thing;
		}
	}

	if (typeof thing !== 'string') {
		throw new Error(`Tried to convert a non-string of type ${typeof thing} to an array buffer`);
	}

	return ByteBuffer.wrap(thing, 'binary').toArrayBuffer();
}

export function joinVectorAndEncryptedData(vector: Uint8Array<ArrayBuffer>, encryptedData: ArrayBuffer) {
	const cipherText = new Uint8Array(encryptedData);
	const output = new Uint8Array(vector.length + cipherText.length);
	output.set(vector, 0);
	output.set(cipherText, vector.length);
	return output;
}

export function splitVectorAndEncryptedData(cipherText: Uint8Array<ArrayBuffer>, ivLength: 12 | 16 = 16): [ArrayBuffer, ArrayBuffer] {
	const vector = cipherText.slice(0, ivLength);
	const encryptedData = cipherText.slice(ivLength);

	return [vector.buffer, encryptedData.buffer];
}

export async function encryptRSA(key: CryptoKey, data: BufferSource) {
	return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);
}

/**
 * Encrypts data using AES-CBC.
 * @param vector The initialization vector.
 * @param key The encryption key.
 * @param data The data to encrypt.
 * @returns The encrypted data.
 * @deprecated Use {@link encryptAesGcm} instead.
 */
export async function encryptAesCbc(vector: Uint8Array<ArrayBuffer>, key: CryptoKey, data: Uint8Array<ArrayBuffer>) {
	return crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, key, data);
}

export async function decryptAesCbc(iv: ArrayBuffer, key: CryptoKey, data: ArrayBuffer) {
	return crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data);
}

export async function encryptAesGcm(iv: ArrayBuffer, key: CryptoKey, data: BufferSource) {
	const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
	return encrypted;
}

export async function decryptAesGcm(iv: ArrayBuffer, key: CryptoKey, data: ArrayBuffer) {
	const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
	return decrypted;
}

export function decryptAes(iv: ArrayBuffer, key: CryptoKey, data: ArrayBuffer) {
	if (key.algorithm.name === 'AES-GCM') {
		return decryptAesGcm(iv, key, data);
	} 
	return decryptAesCbc(iv, key, data);
}

export async function encryptAESCTR(counter: BufferSource, key: CryptoKey, data: BufferSource) {
	return crypto.subtle.encrypt({ name: 'AES-CTR', counter, length: 64 }, key, data);
}

export async function decryptRSA(key: CryptoKey, data: Uint8Array<ArrayBuffer>) {
	return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, data);
}

/**
 * Generates an AES-CBC key.
 * @deprecated Use {@link generateAesGcmKey} instead.
 */
export async function generateAesCbcKey() {
	return crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
}

export function generateAesGcmKey(): Promise<CryptoKey> {
	return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export function generateAESCTRKey(): Promise<CryptoKey> {
	return crypto.subtle.generateKey({ name: 'AES-CTR', length: 256 }, true, ['encrypt', 'decrypt']);
}

export function generateRSAKey(): Promise<CryptoKeyPair> {
	return crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: 'SHA-256' },
		},
		true,
		['encrypt', 'decrypt'],
	);
}

export function exportJWKKey(key: CryptoKey): Promise<JsonWebKey> {
	return crypto.subtle.exportKey('jwk', key);
}

export function importRSAKey(keyData: JsonWebKey, keyUsages: ReadonlyArray<KeyUsage> = ['encrypt', 'decrypt']) {
	return crypto.subtle.importKey(
		'jwk',
		keyData,
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: 'SHA-256' },
		} as any,
		true,
		keyUsages,
	);
}

/**
 * Imports an AES-CBC key from JWK format.
 * @deprecated Use {@link importAesGcmKey} instead.
 */
export function importAesCbcKey(keyData: JsonWebKey, keyUsages: ReadonlyArray<KeyUsage> = ['encrypt', 'decrypt']) {
	return crypto.subtle.importKey('jwk', keyData, { name: 'AES-CBC' }, true, keyUsages);
}

/**
 * Imports an AES-GCM key from JWK format.
 */
export function importAesGcmKey(keyData: JsonWebKey, keyUsages: ReadonlyArray<KeyUsage> = ['encrypt', 'decrypt']) {
	return crypto.subtle.importKey('jwk', keyData, { name: 'AES-GCM' }, true, keyUsages);
}

export function importRawKey(keyData: BufferSource, keyUsages: ReadonlyArray<KeyUsage> = ['deriveKey']) {
	return crypto.subtle.importKey('raw', keyData, { name: 'PBKDF2' }, false, keyUsages);
}

export function deriveKey(salt: Uint8Array<ArrayBuffer>, baseKey: CryptoKey) {
	return crypto.subtle.deriveKey(
		{ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		true,
		['encrypt', 'decrypt'],
	);
}

export function readFileAsArrayBuffer(file: File) {
	return new Promise<ArrayBuffer>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (evt) => {
			resolve(evt.target?.result as ArrayBuffer);
		};
		reader.onerror = (evt) => {
			reject(evt);
		};
		reader.readAsArrayBuffer(file);
	});
}

export async function createSha256HashFromText(data: string) {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function sha256HashFromArrayBuffer(arrayBuffer: ArrayBuffer) {
	const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', arrayBuffer)));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
