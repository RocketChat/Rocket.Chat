import { IServiceClass } from '../ServiceClass';
import { IUser } from '../../../../definition/IUser';
import { E2EEKeyPair } from './E2EEKeyPair';
import { IRoom } from '../../../../definition/IRoom';
import { ISubscription } from '../../../../definition/ISubscription';

export interface IE2EEService extends IServiceClass {
	getUserKeys(uid: IUser['_id']): Promise<E2EEKeyPair | {}>;
	setUserKeys(uid: IUser['_id'], keyPair: E2EEKeyPair): Promise<void>;
	resetUserKeys(uid: IUser['_id']): Promise<void>;
	getRoomMembersWithoutPublicKey(uid: IUser['_id'], rid: IRoom['_id']): Promise<IUser[]>;
	setRoomKeyId(uid: IUser['_id'], rid: IRoom['_id'], keyId: Exclude<IRoom['e2eKeyId'], undefined>): Promise<void>;
	updateGroupKey(uid: IUser['_id'], params: {
		uid: IUser['_id'];
		rid: IRoom['_id'];
		keyId: Exclude<ISubscription['E2EKey'], undefined>;
	}): Promise<ISubscription | null>;
	requestSubscriptionKeys(uid: IUser['_id']): Promise<void>;
}
