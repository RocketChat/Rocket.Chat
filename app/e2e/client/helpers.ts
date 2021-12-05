export const toString = (buffer: ArrayBuffer): string => {
	const view = new Uint8Array(buffer);
	return String.fromCharCode(...view);
};

export const toArrayBuffer = (str: string): ArrayBuffer => {
	const buffer = new ArrayBuffer(str.length);
	const view = new Uint8Array(buffer);
	view.set(Array.from(str, (ch) => ch.charCodeAt(0)));
	return buffer;
};

export const joinVectorAndEncryptedData = (vector: Uint8Array, encryptedData: ArrayBuffer): Uint8Array => {
	const cipherText = new Uint8Array(encryptedData);
	const output = new Uint8Array(vector.length + cipherText.length);
	output.set(vector, 0);
	output.set(cipherText, vector.length);
	return output;
};

export const splitVectorAndEncryptedData = (cipherText: Uint8Array): [vector: Uint8Array, encryptedData: Uint8Array] => {
	const vector = cipherText.slice(0, 16);
	const encryptedData = cipherText.slice(16);

	return [vector, encryptedData];
};

export const encryptRSA = (key: CryptoKey, data: Uint8Array | ArrayBuffer): Promise<ArrayBuffer> =>
	crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);

export const encryptAES = (vector: Uint8Array | ArrayBuffer, key: CryptoKey, data: Uint8Array | ArrayBuffer): Promise<ArrayBuffer> =>
	crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, key, data);

export const decryptRSA = (key: CryptoKey, data: Uint8Array | ArrayBuffer): Promise<ArrayBuffer> =>
	crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, data);

export const decryptAES = (vector: Uint8Array | ArrayBuffer, key: CryptoKey, data: Uint8Array | ArrayBuffer): Promise<ArrayBuffer> =>
	crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, key, data);

export const generateAESKey = (): Promise<CryptoKey> =>
	crypto.subtle.generateKey(
		{
			name: 'AES-CBC',
			length: 128,
		},
		true,
		['encrypt', 'decrypt'],
	);

export const generateRSAKey = (): Promise<CryptoKeyPair> =>
	crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: 'SHA-256' },
		},
		true,
		['encrypt', 'decrypt'],
	);

export const exportJWKKey = (key: CryptoKey): Promise<JsonWebKey> =>
	crypto.subtle.exportKey('jwk', key);

export const importRSAKey = (keyData: JsonWebKey, keyUsages: KeyUsage[] = ['encrypt', 'decrypt']): Promise<CryptoKey> =>
	crypto.subtle.importKey('jwk', keyData, { name: 'RSA-OAEP', 	hash: { name: 'SHA-256' } }, true, keyUsages);

export const importAESKey = (keyData: JsonWebKey, keyUsages: KeyUsage[] = ['encrypt', 'decrypt']): Promise<CryptoKey> =>
	crypto.subtle.importKey('jwk', keyData, { name: 'AES-CBC' }, true, keyUsages);

export const importRawKey = (keyData: ArrayBuffer, keyUsages: KeyUsage[] = ['deriveKey']): Promise<CryptoKey> =>
	crypto.subtle.importKey('raw', keyData, { name: 'PBKDF2' }, false, keyUsages);

export const deriveKey = (salt: ArrayBuffer, baseKey: CryptoKey, keyUsages: KeyUsage[] = ['encrypt', 'decrypt']): Promise<CryptoKey> =>
	crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 1000,
			hash: 'SHA-256',
		},
		baseKey,
		{
			name: 'AES-CBC',
			length: 256,
		},
		true,
		keyUsages,
	);

export const checkSignal = (signal: AbortSignal | undefined): void => {
	if (signal?.aborted) {
		throw new Error('aborted');
	}
};
