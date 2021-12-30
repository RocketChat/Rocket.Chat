import { APIClient } from '../../../../app/utils/client/lib/RestApiClient';
import type { E2EEKeyPair } from '../../../../server/sdk/types/e2ee/E2EEKeyPair';
import { assertAbortSignal } from '../../utils/assertAbortSignal';
import {
	decryptAES,
	encryptAES,
	joinVectorAndEncryptedData,
	splitVectorAndEncryptedData,
	fromStringToBuffer,
	fromBufferToString,
} from '../helpers';
import { parsePrivateKey, parsePublicKey, stringifyKey } from './common';

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

export const resetRemoteKeyPair = async (signal: AbortSignal | undefined): Promise<void> => {
	assertAbortSignal(signal);

	await APIClient.v1.post<E2EEKeyPair, void>('e2e.resetOwnE2EKey');
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
