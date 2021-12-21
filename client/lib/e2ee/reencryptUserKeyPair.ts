import { IUser } from '../../../definition/IUser';
import { createMasterKey } from './keys/master';
import { encryptKeyPair, persistRemoteKeyPair } from './keys/user';

export const reencryptUserKeyPair = async ({
	keyPair,
	uid,
	password,
	signal,
}: {
	keyPair: CryptoKeyPair;
	uid: IUser['_id'];
	password: string;
	signal?: AbortSignal;
}): Promise<void> => {
	const masterKey = await createMasterKey(uid, password);
	const remoteKeyPair = await encryptKeyPair(keyPair, masterKey);
	await persistRemoteKeyPair(remoteKeyPair, signal);
};
