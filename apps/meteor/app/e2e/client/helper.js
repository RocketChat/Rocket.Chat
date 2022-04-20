/* eslint-disable new-cap, no-proto */

import ByteBuffer from 'bytebuffer';

import { getRandomFraction } from '../../../lib/random';

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

export async function generateMnemonicPhrase(n, sep = ' ') {
	const { default: wordList } = await import('./wordList');
	const result = new Array(n);
	let len = wordList.length;
	const taken = new Array(len);

	while (n--) {
		const x = Math.floor(getRandomFraction() * len);
		result[n] = wordList[x in taken ? taken[x] : x];
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
