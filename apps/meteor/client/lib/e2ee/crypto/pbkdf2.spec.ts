import { importBaseKey, derive, importKey } from './pbkdf2';

describe('pbkdf2', () => {
	it('should import a base key', async () => {
		const keyData = new Uint8Array([1, 2, 3, 4, 5]);
		const baseKey = await importBaseKey(keyData);
		expect<'PBKDF2'>(baseKey.algorithm.name).toBe('PBKDF2');
		expect<false>(baseKey.extractable).toBe(false);
		expect<'secret'>(baseKey.type).toBe('secret');
		expect<1>(baseKey.usages.length).toBe(1);
		expect<'deriveBits'>(baseKey.usages[0]).toBe('deriveBits');
	});

	it('should derive bits from a base key', async () => {
		const keyData = new Uint8Array([1, 2, 3, 4, 5]);
		const salt = new Uint8Array([5, 4, 3, 2, 1]);
		const iterations = 1000;
		const baseKey = await importBaseKey(keyData);
		const derivedBits = await derive(baseKey, { salt, iterations });
		expect<false>(derivedBits.detached).toBe(false);
		expect<false>(derivedBits.resizable).toBe(false);
		expect<32>(derivedBits.byteLength).toBe(32);
		expect<32>(derivedBits.maxByteLength).toBe(32);
		expect<() => never>(() => derivedBits.resize(32)).toThrow();
	});

	it('should import a derived key for AES-CBC', async () => {
		const baseKey = await importBaseKey(new Uint8Array([1, 2, 3, 4, 5]));
		const derivedBits = await derive(baseKey, { salt: new Uint8Array([5, 4, 3, 2, 1]), iterations: 1000 });
		const derivedKey = await importKey(derivedBits, { name: 'AES-CBC', length: 256 });
		expect<256>(derivedKey.algorithm.length).toBe(256);
		expect<'AES-CBC'>(derivedKey.algorithm.name).toBe('AES-CBC');
		expect<false>(derivedKey.extractable).toBe(false);
		expect<'secret'>(derivedKey.type).toBe('secret');
		expect<1>(derivedKey.usages.length).toBe(1);
		expect<['decrypt']>(derivedKey.usages).toEqual(['decrypt']);
	});

	it('should import a derived key for AES-GCM', async () => {
		const baseKey = await importBaseKey(new Uint8Array([1, 2, 3, 4, 5]));
		const derivedBits = await derive(baseKey, { salt: new Uint8Array([5, 4, 3, 2, 1]), iterations: 1000 });
		const derivedKey = await importKey(derivedBits, { name: 'AES-GCM', length: 256 });
		expect<256>(derivedKey.algorithm.length).toBe(256);
		expect<'AES-GCM'>(derivedKey.algorithm.name).toBe('AES-GCM');
		expect<false>(derivedKey.extractable).toBe(false);
		expect<'secret'>(derivedKey.type).toBe('secret');
		expect<['encrypt', 'decrypt'] | ['decrypt', 'encrypt']>(derivedKey.usages).toEqual(['encrypt', 'decrypt']);
	});
});
