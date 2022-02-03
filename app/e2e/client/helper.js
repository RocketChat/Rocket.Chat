/* eslint-disable new-cap, no-proto */

import * as crypto_module from 'crypto';

import ByteBuffer from 'bytebuffer';

import { words } from './wordList';

const StaticArrayBufferProto = new ArrayBuffer().__proto__;

export function toString(thing) {
	if (typeof thing === 'string') {
		return thing;
	}
	return new ByteBuffer.wrap(thing).toString('binary');
}

export function toArrayBuffer(thing) {
	if (thing === undefined) {
		return undefined;
	}
	if (thing === Object(thing)) {
		if (thing.__proto__ === StaticArrayBufferProto) {
			return thing;
		}
	}

	if (typeof thing !== 'string') {
		throw new Error(`Tried to convert a non-string of type ${typeof thing} to an array buffer`);
	}
	return new ByteBuffer.wrap(thing, 'binary').toArrayBuffer();
}

export function joinVectorAndEcryptedData(vector, encryptedData) {
	const cipherText = new Uint8Array(encryptedData);
	const output = new Uint8Array(vector.length + cipherText.length);
	output.set(vector, 0);
	output.set(cipherText, vector.length);
	return output;
}

export function splitVectorAndEcryptedData(cipherText) {
	const vector = cipherText.slice(0, 16);
	const encryptedData = cipherText.slice(16);

	return [vector, encryptedData];
}

export async function encryptRSA(key, data) {
	return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, data);
}

export async function encryptAES(vector, key, data) {
	return crypto.subtle.encrypt({ name: 'AES-CBC', iv: vector }, key, data);
}

export async function decryptRSA(key, data) {
	return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, data);
}

export async function decryptAES(vector, key, data) {
	return crypto.subtle.decrypt({ name: 'AES-CBC', iv: vector }, key, data);
}

export async function generateAESKey() {
	return crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);
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

export async function exportJWKKey(key) {
	return crypto.subtle.exportKey('jwk', key);
}

export async function importRSAKey(keyData, keyUsages = ['encrypt', 'decrypt']) {
	return crypto.subtle.importKey(
		'jwk',
		keyData,
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
			hash: { name: 'SHA-256' },
		},
		true,
		keyUsages,
	);
}

export async function importAESKey(keyData, keyUsages = ['encrypt', 'decrypt']) {
	return crypto.subtle.importKey('jwk', keyData, { name: 'AES-CBC' }, true, keyUsages);
}

export async function importRawKey(keyData, keyUsages = ['deriveKey']) {
	return crypto.subtle.importKey('raw', keyData, { name: 'PBKDF2' }, false, keyUsages);
}

export async function deriveKey(salt, baseKey, keyUsages = ['encrypt', 'decrypt']) {
	const iterations = 1000;
	const hash = 'SHA-256';

	return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash }, baseKey, { name: 'AES-CBC', length: 256 }, true, keyUsages);
}

export async function readFileAsArrayBuffer(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = function (evt) {
			resolve(evt.target.result);
		};
		reader.onerror = function (evt) {
			reject(evt);
		};
		reader.readAsArrayBuffer(file);
	});
}

function hexString(digits) {
	const numBytes = Math.ceil(digits / 2);
	let bytes;
	// Try to get cryptographically strong randomness. Fall back to
	// non-cryptographically strong if not available.
	try {
		bytes = crypto_module.randomBytes(numBytes);
	} catch (e) {
		// XXX should re-throw any error except insufficient entropy
		bytes = crypto_module.pseudoRandomBytes(numBytes);
	}
	const result = bytes.toString('hex');
	// If the number of digits is odd, we'll have generated an extra 4 bits
	// of randomness, so we need to trim the last digit.
	return result.substring(0, digits);
}

// criptographically secure way of generating a number between 0-1( similar to Math.random())
function fraction() {
	const numerator = Number.parseInt(hexString(8), 16);
	return numerator * 2.3283064365386963e-10; // 2^-3;
}

export function generateMnemonicPhrase(n, sep = ' ') {
	const result = new Array(n);
	let len = words.length;
	const taken = new Array(len);

	while (n--) {
		const x = Math.floor(fraction() * len);
		result[n] = words[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len;
	}
	return result.join(sep);
}

export class Deferred {
	constructor() {
		const p = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});

		p.resolve = this.resolve;
		p.reject = this.reject;

		return p;
	}
}
