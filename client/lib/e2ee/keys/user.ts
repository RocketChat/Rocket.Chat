import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../../../app/utils/client/lib/RestApiClient';
import type { E2EEKeyPair } from '../../../../server/sdk/types/e2ee/E2EEKeyPair';
import { assertAbortSignal } from '../../utils/assertAbortSignal';
import {
	decryptAES,
	encryptAES,
	exportJWKKey,
	generateRSAKey,
	importRSAKey,
	joinVectorAndEncryptedData,
	splitVectorAndEncryptedData,
	fromStringToBuffer,
	fromBufferToString,
} from '../helpers';

// Utilities to handle the user's key pair

const parsePublicKey = async (keyString: string): Promise<CryptoKey> => {
	const keyJWK: JsonWebKey = JSON.parse(keyString);
	return importRSAKey(keyJWK, ['encrypt']);
};

const parsePrivateKey = async (keyString: string): Promise<CryptoKey> => {
	const keyJWK: JsonWebKey = JSON.parse(keyString);
	return importRSAKey(keyJWK, ['decrypt']);
};

const stringifyKey = async (key: CryptoKey): Promise<string> => {
	const keyJWK = await exportJWKKey(key);
	return JSON.stringify(keyJWK);
};

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

export type RemoteKeyPair = {
	publicKey: string;
	privateKey: string;
};

export const fetchRemoteKeyPair = async (signal: AbortSignal | undefined): Promise<RemoteKeyPair | undefined> => {
	assertAbortSignal(signal);

	const { public_key: publicKeyString, private_key: encryptedPrivateKey } = await APIClient.v1.get<{}, Partial<E2EEKeyPair>>(
		'e2e.fetchMyKeys',
	);

	assertAbortSignal(signal);

	if (!publicKeyString || !encryptedPrivateKey) {
		return undefined;
	}

	return {
		publicKey: publicKeyString,
		privateKey: encryptedPrivateKey,
	};
};

export const persistRemoteKeyPair = async ({ publicKey, privateKey }: RemoteKeyPair, signal: AbortSignal | undefined): Promise<void> => {
	assertAbortSignal(signal);

	await APIClient.v1.post<E2EEKeyPair, void>('e2e.setUserPublicAndPrivateKeys', {
		// eslint-disable-next-line @typescript-eslint/camelcase
		public_key: publicKey,
		// eslint-disable-next-line @typescript-eslint/camelcase
		private_key: privateKey,
	});
};

export const encryptKeyPair = async ({ publicKey, privateKey }: CryptoKeyPair, masterKey: CryptoKey): Promise<RemoteKeyPair> => {
	const publicKeyString = await stringifyKey(publicKey);
	const privateKeyString = await stringifyKey(privateKey);
	const privateKeyBuffer = fromStringToBuffer(privateKeyString);
	const vector = crypto.getRandomValues(new Uint8Array(16));
	const encryptedPrivateKeyBuffer = await encryptAES(vector, masterKey, privateKeyBuffer);
	const payload = joinVectorAndEncryptedData(vector, encryptedPrivateKeyBuffer);
	const encryptedPrivateKey = JSON.stringify([...payload]);

	return {
		publicKey: publicKeyString,
		privateKey: encryptedPrivateKey,
	};
};

export const decryptKeyPair = async (
	{ publicKey: publicKeyString, privateKey: encryptedPrivateKey }: RemoteKeyPair,
	masterKey: CryptoKey,
): Promise<CryptoKeyPair> => {
	const publicKey = await parsePublicKey(publicKeyString);
	const payload = new Uint8Array(JSON.parse(encryptedPrivateKey));
	const [vector, encryptedPrivateKeyBuffer] = splitVectorAndEncryptedData(payload);
	const privateKeyBuffer = await decryptAES(vector, masterKey, encryptedPrivateKeyBuffer);
	const privateKeyString = fromBufferToString(privateKeyBuffer);
	const privateKey = await parsePrivateKey(privateKeyString);

	return {
		publicKey,
		privateKey,
	};
};
