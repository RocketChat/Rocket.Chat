import { Random } from 'meteor/random';

import { IUser } from '../../../../definition/IUserAction';
import { fromStringToBuffer } from '../helpers';

const deriveKey = (salt: ArrayBuffer, baseKey: CryptoKey, keyUsages: KeyUsage[] = ['encrypt', 'decrypt']): Promise<CryptoKey> =>
	crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: 1000,
			hash: 'SHA-256',
		},
		baseKey,
		{
			name: 'AES-CBC',
			length: 256,
		},
		true,
		keyUsages,
	);

const importRawKey = (keyData: ArrayBuffer, keyUsages: KeyUsage[] = ['deriveKey']): Promise<CryptoKey> =>
	crypto.subtle.importKey('raw', keyData, { name: 'PBKDF2' }, false, keyUsages);

export const generateRandomPassword = (): string => `${Random.id(3)}-${Random.id(3)}-${Random.id(3)}`.toLowerCase();

export const createMasterKey = async (uid: IUser['_id'], password: string): Promise<CryptoKey> => {
	const salt = fromStringToBuffer(uid);
	const keyBuffer = fromStringToBuffer(password);
	const key = await importRawKey(keyBuffer);
	return deriveKey(salt, key);
};
