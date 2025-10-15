import { webcrypto } from 'node:crypto';

import { importBaseKey, deriveBits, importKey } from './pbkdf2';

Object.assign(globalThis.crypto, { subtle: webcrypto.subtle });

describe('pbkdf2', () => {
	it('should import a base key', async () => {
		const keyData = new Uint8Array([1, 2, 3, 4, 5]);
		const baseKey = await importBaseKey(keyData);
		expect(baseKey).toBeDefined();
		expect(baseKey.algorithm).toEqual({ name: 'PBKDF2' });
		expect(baseKey.extractable).toBe(false);
		expect(baseKey.type).toBe('secret');
		expect(baseKey.usages).toEqual(['deriveBits']);
	});

	it('should derive bits from a base key', async () => {
		const keyData = new Uint8Array([1, 2, 3, 4, 5]);
		const salt = new Uint8Array([5, 4, 3, 2, 1]);
		const iterations = 1000;
		const baseKey = await importBaseKey(keyData);
		const derivedBits = await deriveBits(baseKey, { salt, iterations });
		expect(derivedBits).toBeDefined();
		expect(derivedBits.byteLength).toBe(32);
	});

	it('should import a derived key for AES-CBC', async () => {
		const baseKey = await importBaseKey(new Uint8Array([1, 2, 3, 4, 5]));
		const derivedBits = await deriveBits(baseKey, { salt: new Uint8Array([5, 4, 3, 2, 1]), iterations: 1000 });
		const algorithm = 'AES-CBC';
		const derivedKey = await importKey(derivedBits, algorithm);
		expect(derivedKey).toBeDefined();
		expect(derivedKey.algorithm).toEqual({ name: 'AES-CBC', length: 256 });
		expect(derivedKey.extractable).toBe(false);
		expect(derivedKey.type).toBe('secret');
		expect(derivedKey.usages).toEqual(['decrypt']);
	});

	it('should import a derived key for AES-GCM', async () => {
		const baseKey = await importBaseKey(new Uint8Array([1, 2, 3, 4, 5]));
		const derivedBits = await deriveBits(baseKey, { salt: new Uint8Array([5, 4, 3, 2, 1]), iterations: 1000 });
		const algorithm = 'AES-GCM';
		const derivedKey = await importKey(derivedBits, algorithm);
		expect(derivedKey).toBeDefined();
		expect(derivedKey.algorithm).toEqual({ name: 'AES-GCM', length: 256 });
		expect(derivedKey.extractable).toBe(false);
		expect(derivedKey.type).toBe('secret');
		expect(derivedKey.usages).toEqual(['encrypt', 'decrypt']);
	});
});
