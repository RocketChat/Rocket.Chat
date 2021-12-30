import { IUser } from '../../../definition/IUserAction';
import { isAbortError } from '../utils/isAbortError';
import * as local from './keys/local';
import * as master from './keys/master';
import * as remote from './keys/remote';

/** a callback triggered when the (remote) key pair should be fetched (from the server) */
export type OnDecryptingRemoteKeyPair = ({ onConfirm }: { onConfirm: () => void }) => void;

/** a callback triggered when the user should input the master key */
export type OnPromptingForPassword = ({ onInput, onCancel }: { onInput: (password: string) => void; onCancel: () => void }) => void;

/** a callback triggered when the decryption of the remote key pair fails */
export type OnFailureToDecrypt = ({ onRetry, onAccept }: { onRetry: () => void; onAccept: () => void }) => void;

/** a callback triggered when a random master key is generated */
export type OnGenerateRandomPassword = (password: string) => void;

type FetchUserKeyPairContext = {
	signal?: AbortSignal;
	uid: IUser['_id'];
	onDecryptingRemoteKeyPair: OnDecryptingRemoteKeyPair;
	onPromptingForPassword: OnPromptingForPassword;
	onFailureToDecrypt: OnFailureToDecrypt;
	onGenerateRandomPassword: OnGenerateRandomPassword;
};

const pushKeyPair = async (keyPair: CryptoKeyPair, context: FetchUserKeyPairContext): Promise<void> => {
	const { uid, onGenerateRandomPassword, signal } = context;

	const password = master.generateRandomPassword();
	const masterKey = await master.createMasterKey(uid, password);
	const remoteKeyPair = await remote.encryptKeyPair(keyPair, masterKey);
	await remote.persistRemoteKeyPair(remoteKeyPair, signal);
	onGenerateRandomPassword(password);
};

const pullKeyPair = async (remoteKeyPair: remote.RemoteKeyPair, context: FetchUserKeyPairContext): Promise<CryptoKeyPair> =>
	new Promise((resolve) => {
		const { uid, onDecryptingRemoteKeyPair, onPromptingForPassword, onFailureToDecrypt, signal } = context;

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
					const masterKey = await master.createMasterKey(uid, password);
					const keyPair = await remote.decryptKeyPair(remoteKeyPair, masterKey);
					await local.persistKeyPair(keyPair, signal);
					resolve(keyPair);
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

export const fetchKeys = async (context: FetchUserKeyPairContext): Promise<CryptoKeyPair> => {
	const { signal } = context;

	const keyPair = await local.fetchKeyPair(signal);
	const remoteKeyPair = await remote.fetchRemoteKeyPair(signal);

	if (keyPair) {
		if (!remoteKeyPair) {
			await pushKeyPair(keyPair, context);
		}

		return keyPair;
	}

	if (!remoteKeyPair) {
		const keyPair = await local.createKeyPair();
		await pushKeyPair(keyPair, context);
		await local.persistKeyPair(keyPair, signal);
		return keyPair;
	}

	return pullKeyPair(remoteKeyPair, context);
};

export const forgetKeys = (): void => {
	local.resetKeyPair();
};

type ChangePasswordParams = {
	keyPair: CryptoKeyPair;
	uid: IUser['_id'];
	password: string;
	signal?: AbortSignal;
};

export const changePassword = async ({ keyPair, uid, password, signal }: ChangePasswordParams): Promise<void> => {
	const masterKey = await master.createMasterKey(uid, password);
	const remoteKeyPair = await remote.encryptKeyPair(keyPair, masterKey);
	await remote.persistRemoteKeyPair(remoteKeyPair, signal);
};

type ResetUserKeyPairParams = {
	signal?: AbortSignal;
};

export const resetKeys = async ({ signal }: ResetUserKeyPairParams = {}): Promise<void> => {
	await remote.resetRemoteKeyPair(signal);
};
