function ab2str(buf: ArrayBuffer): string {
	return String.fromCharCode(...new Uint16Array(buf));
}

export async function generateKey(): Promise<string> {
	const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
	const exportedKey = await crypto.subtle.exportKey('jwk', key);
	return JSON.stringify(exportedKey);
}

export async function getKeyFromString(keyStr: string): Promise<CryptoKey> {
	const key = JSON.parse(keyStr);
	return crypto.subtle.importKey('jwk', key, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function encrypt(text: string, key: CryptoKey): Promise<string> {
	const vector = crypto.getRandomValues(new Uint8Array(16));
	const data = new TextEncoder().encode(text);
	const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: vector }, key, data);
	const cipherText = new Uint8Array(enc);
	return encodeURIComponent(btoa(ab2str(vector) + ab2str(cipherText)));
}
