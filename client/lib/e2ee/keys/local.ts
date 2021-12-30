import { Meteor } from 'meteor/meteor';

import { assertAbortSignal } from '../../utils/assertAbortSignal';
import { parsePrivateKey, parsePublicKey, stringifyKey } from './common';

const generateRSAKey = (): Promise<CryptoKeyPair> =>
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

export const createKeyPair = async (): Promise<CryptoKeyPair> => generateRSAKey();

export const fetchKeyPair = async (signal: AbortSignal | undefined): Promise<CryptoKeyPair | undefined> => {
	assertAbortSignal(signal);

	const publicKeyString = Meteor._localStorage.getItem('public_key');
	const privateKeyString = Meteor._localStorage.getItem('private_key');

	if (!publicKeyString || !privateKeyString) {
		return undefined;
	}

	const publicKey = await parsePublicKey(publicKeyString);
	const privateKey = await parsePrivateKey(privateKeyString);

	assertAbortSignal(signal);

	return { publicKey, privateKey };
};

export const persistKeyPair = async ({ publicKey, privateKey }: CryptoKeyPair, signal: AbortSignal | undefined): Promise<void> => {
	assertAbortSignal(signal);

	const publicKeyString = await stringifyKey(publicKey);
	const privateKeyString = await stringifyKey(privateKey);

	assertAbortSignal(signal);

	Meteor._localStorage.setItem('public_key', publicKeyString);
	Meteor._localStorage.setItem('private_key', privateKeyString);
};

export const resetKeyPair = (): void => {
	Meteor._localStorage.removeItem('public_key');
	Meteor._localStorage.removeItem('private_key');
};
