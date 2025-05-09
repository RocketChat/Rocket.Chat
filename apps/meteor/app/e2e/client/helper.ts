import { Random } from '@rocket.chat/random';
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

export function joinVectorAndEcryptedData(vector: any, encryptedData: any) {
	const cipherText = new Uint8Array(encryptedData);
	const output = new Uint8Array(vector.length + cipherText.length);
	output.set(vector, 0);
	output.set(cipherText, vector.length);
	return output;
}

export function splitVectorAndEcryptedData(cipherText: any) {
	const vector = cipherText.slice(0, 16);
	const encryptedData = cipherText.slice(16);

	return [vector, encryptedData];
}

export async function encryptRSA(key: any, data: any) {
	return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);
}

export async function encryptAES(vector: Uint8Array<ArrayBuffer>, key: CryptoKey, data: Uint8Array<ArrayBufferLike>) {
	return crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, key, data);
}

export async function encryptAESCTR(vector: any, key: any, data: any) {
	return crypto.subtle.encrypt({ name: 'AES-CTR', counter: vector, length: 64 }, key, data);
}

export async function decryptRSA(key: CryptoKey, data: Uint8Array<ArrayBuffer>) {
	return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, data);
}

export async function decryptAES(vector: Uint8Array<ArrayBufferLike>, key: CryptoKey, data: Uint8Array<ArrayBufferLike>) {
	return crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, key, data);
}

export async function generateAESKey() {
	return crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
}

export async function generateAESCTRKey() {
	return crypto.subtle.generateKey({ name: 'AES-CTR', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function generateRSAKey() {
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

export async function exportJWKKey(key: any) {
	return crypto.subtle.exportKey('jwk', key);
}

export async function importRSAKey(keyData: any, keyUsages: ReadonlyArray<KeyUsage> = ['encrypt', 'decrypt']) {
	return crypto.subtle.importKey(
		'jwk' as any,
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

export async function importAESKey(keyData: any, keyUsages: ReadonlyArray<KeyUsage> = ['encrypt', 'decrypt']) {
	return crypto.subtle.importKey('jwk', keyData, { name: 'AES-CBC' }, true, keyUsages);
}

export async function importRawKey(keyData: any, keyUsages: ReadonlyArray<KeyUsage> = ['deriveKey']) {
	return crypto.subtle.importKey('raw', keyData, { name: 'PBKDF2' }, false, keyUsages);
}

export async function deriveKey(salt: any, baseKey: any, keyUsages: ReadonlyArray<KeyUsage> = ['encrypt', 'decrypt']) {
	const iterations = 1000;
	const hash = 'SHA-256';

	return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash }, baseKey, { name: 'AES-CBC', length: 256 }, true, keyUsages);
}

export async function readFileAsArrayBuffer(file: File) {
	return new Promise<any>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (evt) => {
			resolve(evt.target?.result);
		};
		reader.onerror = (evt) => {
			reject(evt);
		};
		reader.readAsArrayBuffer(file);
	});
}

export async function generateMnemonicPhrase(n: any, sep = ' ') {
	const { default: wordList } = await import('./wordList');
	const result = new Array(n);
	let len = wordList.length;
	const taken = new Array(len);

	while (n--) {
		const x = Math.floor(Random.fraction() * len);
		result[n] = wordList[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len;
	}
	return result.join(sep);
}

export async function createSha256HashFromText(data: any) {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function sha256HashFromArrayBuffer(arrayBuffer: any) {
	const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', arrayBuffer)));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
