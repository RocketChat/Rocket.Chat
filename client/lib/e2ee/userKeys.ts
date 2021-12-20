import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import {
	decryptAES,
	deriveKey,
	encryptAES,
	exportJWKKey,
	generateRSAKey,
	importRawKey,
	importRSAKey,
	joinVectorAndEncryptedData,
	splitVectorAndEncryptedData,
	toArrayBuffer,
	toString,
} from '../../../app/e2e/client/helpers';
import { APIClient } from '../../../app/utils/client/lib/RestApiClient';
import { IUser } from '../../../definition/IUserAction';
import type { E2EEKeyPair } from '../../../server/sdk/types/e2ee/E2EEKeyPair';
import { assertAbortSignal } from '../utils/assertAbortSignal';
import { isAbortError } from '../utils/isAbortError';

const generateRandomPassword = (): string =>
	`${Random.id(3)}-${Random.id(3)}-${Random.id(3)}`.toLowerCase();

const createMasterKey = async (uid: IUser['_id'], password: string): Promise<CryptoKey> => {
	const salt = toArrayBuffer(uid);
	const rawKey = toArrayBuffer(password);
	const key = await importRawKey(rawKey);
	return deriveKey(salt, key);
};

const parsePublicKey = async (publicKeyString: string): Promise<CryptoKey> => {
	const publicKeyJWK: JsonWebKey = JSON.parse(publicKeyString);
	return importRSAKey(publicKeyJWK, ['encrypt']);
};

const parsePrivateKey = async (privateKeyString: string): Promise<CryptoKey> => {
	const privateKeyJWK: JsonWebKey = JSON.parse(privateKeyString);
	return importRSAKey(privateKeyJWK, ['decrypt']);
};

const stringifyKey = async (key: CryptoKey): Promise<string> => {
	const keyJWK = await exportJWKKey(key);
	return JSON.stringify(keyJWK);
};

const createKeyPair = async (): Promise<CryptoKeyPair> => generateRSAKey();

const fetchLocalKeyPair = async (
	signal: AbortSignal | undefined,
): Promise<CryptoKeyPair | undefined> => {
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

const persistLocalKeyPair = async (
	{ publicKey, privateKey }: CryptoKeyPair,
	signal: AbortSignal | undefined,
): Promise<void> => {
	assertAbortSignal(signal);

	const publicKeyString = await stringifyKey(publicKey);
	const privateKeyString = await stringifyKey(privateKey);

	assertAbortSignal(signal);

	Meteor._localStorage.setItem('public_key', publicKeyString);
	Meteor._localStorage.setItem('private_key', privateKeyString);
};

type RemoteKeyPair = {
	publicKey: string;
	privateKey: string;
};

const fetchRemoteKeyPair = async (
	signal: AbortSignal | undefined,
): Promise<RemoteKeyPair | undefined> => {
	assertAbortSignal(signal);

	const { public_key: publicKeyString, private_key: encryptedPrivateKey } = await APIClient.v1.get<
		{},
		Partial<E2EEKeyPair>
	>('e2e.fetchMyKeys');

	assertAbortSignal(signal);

	if (!publicKeyString || !encryptedPrivateKey) {
		return undefined;
	}

	return {
		publicKey: publicKeyString,
		privateKey: encryptedPrivateKey,
	};
};

const persistRemoteKeyPair = async (
	{ publicKey, privateKey }: RemoteKeyPair,
	signal: AbortSignal | undefined,
): Promise<void> => {
	assertAbortSignal(signal);

	await APIClient.v1.post<E2EEKeyPair, void>('e2e.setUserPublicAndPrivateKeys', {
		// eslint-disable-next-line @typescript-eslint/camelcase
		public_key: publicKey,
		// eslint-disable-next-line @typescript-eslint/camelcase
		private_key: privateKey,
	});
};

const encryptLocalKeyPair = async (
	{ publicKey, privateKey }: CryptoKeyPair,
	masterKey: CryptoKey,
): Promise<RemoteKeyPair> => {
	const publicKeyString = await stringifyKey(publicKey);
	const privateKeyString = await stringifyKey(privateKey);
	const privateKeyBuffer = toArrayBuffer(privateKeyString);
	const vector = crypto.getRandomValues(new Uint8Array(16));
	const encryptedPrivateKeyBuffer = await encryptAES(vector, masterKey, privateKeyBuffer);
	const payload = joinVectorAndEncryptedData(vector, encryptedPrivateKeyBuffer);
	const encryptedPrivateKey = JSON.stringify([...payload]);

	return {
		publicKey: publicKeyString,
		privateKey: encryptedPrivateKey,
	};
};

export const decryptRemoteKeyPair = async (
	{ publicKey: publicKeyString, privateKey: encryptedPrivateKey }: RemoteKeyPair,
	masterKey: CryptoKey,
): Promise<CryptoKeyPair> => {
	const publicKey = await parsePublicKey(publicKeyString);
	const payload = new Uint8Array(JSON.parse(encryptedPrivateKey));
	const [vector, encryptedPrivateKeyBuffer] = splitVectorAndEncryptedData(payload);
	const privateKeyBuffer = await decryptAES(vector, masterKey, encryptedPrivateKeyBuffer);
	const privateKeyString = toString(privateKeyBuffer);
	const privateKey = await parsePrivateKey(privateKeyString);

	return {
		publicKey,
		privateKey,
	};
};

const createRemoteKeyPair = async ({
	localKeyPair,
	uid,
	onGenerateRandomPassword,
	signal,
}: {
	localKeyPair: CryptoKeyPair;
	uid: IUser['_id'];
	onGenerateRandomPassword: (password: string) => void;
	signal: AbortSignal | undefined;
}): Promise<void> => {
	const password = generateRandomPassword();
	const masterKey = await createMasterKey(uid, password);
	const remoteKeyPair = await encryptLocalKeyPair(localKeyPair, masterKey);
	await persistRemoteKeyPair(remoteKeyPair, signal);
	onGenerateRandomPassword(password);
};

const handleRemoteKeyDecryption = async ({
	uid,
	remoteKeyPair,
	onDecryptingRemoteKeyPair,
	onPromptingForPassword,
	onFailureToDecrypt,
	signal,
}: {
	uid: IUser['_id'];
	remoteKeyPair: RemoteKeyPair;
	onDecryptingRemoteKeyPair: (options: { onConfirm: () => void }) => void;
	onPromptingForPassword: (options: {
		onInput: (password: string) => void;
		onCancel: () => void;
	}) => void;
	onFailureToDecrypt: (options: { onRetry: () => void; onAccept: () => void }) => void;
	signal?: AbortSignal;
}): Promise<CryptoKeyPair> =>
	new Promise((resolve) => {
		const states = {
			informingKeyDecryption(): void {
				onDecryptingRemoteKeyPair({
					onConfirm: () => {
						this.promptingForPassword();
					},
				});
			},
			promptingForPassword(): void {
				onPromptingForPassword({
					onInput: (password: string) => {
						this.decrypting(password);
					},
					onCancel: () => {
						this.informingKeyDecryption();
					},
				});
			},
			async decrypting(password: string): Promise<void> {
				try {
					const masterKey = await createMasterKey(uid, password);
					const localKeyPair = await decryptRemoteKeyPair(remoteKeyPair, masterKey);
					await persistLocalKeyPair(localKeyPair, signal);
					resolve(localKeyPair);
				} catch (error) {
					console.error(error);

					if (isAbortError(error)) {
						throw error;
					}

					this.failedToDecrypt();
				}
			},
			failedToDecrypt(): void {
				onFailureToDecrypt({
					onRetry: () => {
						this.promptingForPassword();
					},
					onAccept: () => {
						this.informingKeyDecryption();
					},
				});
			},
		};

		states.informingKeyDecryption();
	});

type FetchUserKeysOptions = {
	uid: IUser['_id'];
	onDecryptingRemoteKeyPair: (options: { onConfirm: () => void }) => void;
	onPromptingForPassword: (options: {
		onInput: (password: string) => void;
		onCancel: () => void;
	}) => void;
	onFailureToDecrypt: (options: { onRetry: () => void; onAccept: () => void }) => void;
	onGenerateRandomPassword: (password: string) => void;
	signal?: AbortSignal;
};

export const fetchUserKeys = async ({
	uid,
	onDecryptingRemoteKeyPair,
	onPromptingForPassword,
	onFailureToDecrypt,
	onGenerateRandomPassword,
	signal,
}: FetchUserKeysOptions): Promise<CryptoKeyPair> => {
	const localKeyPair = await fetchLocalKeyPair(signal);
	const remoteKeyPair = await fetchRemoteKeyPair(signal);

	if (localKeyPair) {
		if (!remoteKeyPair) {
			await createRemoteKeyPair({
				localKeyPair,
				uid,
				onGenerateRandomPassword,
				signal,
			});
		}

		return localKeyPair;
	}

	if (!remoteKeyPair) {
		const localKeyPair = await createKeyPair();
		await createRemoteKeyPair({
			localKeyPair,
			uid,
			onGenerateRandomPassword,
			signal,
		});
		await persistLocalKeyPair(localKeyPair, signal);
		return localKeyPair;
	}

	return handleRemoteKeyDecryption({
		uid,
		remoteKeyPair,
		onDecryptingRemoteKeyPair,
		onPromptingForPassword,
		onFailureToDecrypt,
		signal,
	});
};
