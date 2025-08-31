export const generateAesCbcKey = async (): Promise<CryptoKey> => {
	const key = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
	return key;
};

export const encryptAesCbc = async (
	vector: Uint8Array<ArrayBuffer>,
	key: CryptoKey,
	data: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> => {
	const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, key, data);
	return encrypted;
};

export const decryptAesCbc = async (
	vector: Uint8Array<ArrayBuffer>,
	key: CryptoKey,
	data: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> => {
	const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, key, data);
	return decrypted;
};

export const generateAesGcmKey = async (): Promise<CryptoKey> => {
	const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
	return key;
};

export const encryptAesGcm = async (iv: Uint8Array<ArrayBuffer>, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer> => {
	const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
	return encrypted;
};

export const decryptAesGcm = async (iv: Uint8Array<ArrayBuffer>, key: CryptoKey, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> => {
	const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
	return decrypted;
};
