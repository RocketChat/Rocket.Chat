import * as Jwk from '../jwk.ts';
import { expect, test } from 'vitest';

test('parse JWK', async () => {
	const jwk = Jwk.parse(
		'{"kty":"RSA","e":"AQAB","n":"sXchm3y8v4j5b0kV7c1u5rX2a6pY9H3j5x7v9y3z4w5v6y7z8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7"}',
	);
	expect(Jwk.is(jwk)).toBe(true);
});

test('invalid Json', async () => {
	expect(() => Jwk.parse('{"kty":"RSA","e":"AQAB","n":123}')).toThrow();
});

test('invalid JWK', async () => {
	const jwk = {
		kty: 'oct',
	};
	expect(Jwk.is(jwk)).toBe(false);
});

test('AES-CBC', async () => {
	const key = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
	const jwk = await crypto.subtle.exportKey('jwk', key);

	expect(Jwk.is(jwk)).toBe(true);
	expect(Jwk.isAesCbc(jwk)).toBe(true);
});

test('AES-GCM', async () => {
	const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
	const jwk = await crypto.subtle.exportKey('jwk', key);
	expect(Jwk.is(jwk)).toBe(true);
	expect(Jwk.isAesGcm(jwk)).toBe(true);
});

test('RSA-OAEP', async () => {
	const key = await crypto.subtle.generateKey(
		{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['encrypt', 'decrypt'],
	);

	const publicJwk = await crypto.subtle.exportKey('jwk', key.publicKey);

	expect(Jwk.is(publicJwk)).toBe(true);
	expect(Jwk.isRsaOaep(publicJwk)).toBe(true);

	const privateJwk = await crypto.subtle.exportKey('jwk', key.privateKey);

	expect(Jwk.is(privateJwk)).toBe(true);
	expect(Jwk.isRsaOaep(privateJwk)).toBe(true);
});
