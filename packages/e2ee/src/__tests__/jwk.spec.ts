import * as Jwk from '../jwk.ts';
import { expect, test } from 'vitest';

test('AES-CBC', async () => {
	const key = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
	const jwk = await crypto.subtle.exportKey('jwk', key);

	expect(Jwk.is(jwk)).toBe(true);
	expect(Jwk.isAesCbc(jwk)).toBe(true);
});

test('AES-GCM', async () => {
	const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
	const jwk = await crypto.subtle.exportKey('jwk', key);
	expect(Jwk.isAesGcm(jwk)).toBe(true);
});
