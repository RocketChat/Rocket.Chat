import { Random } from 'meteor/random';

import { IUser } from '../../../../definition/IUserAction';
import { deriveKey, importRawKey, fromStringToBuffer } from '../helpers';

// Utilities to handle the master key (the one that encrypts user keys on server)

export const generateRandomPassword = (): string =>
	`${Random.id(3)}-${Random.id(3)}-${Random.id(3)}`.toLowerCase();

export const createMasterKey = async (uid: IUser['_id'], password: string): Promise<CryptoKey> => {
	const salt = fromStringToBuffer(uid);
	const keyBuffer = fromStringToBuffer(password);
	const key = await importRawKey(keyBuffer);
	return deriveKey(salt, key);
};
