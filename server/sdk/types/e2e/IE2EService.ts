import { IServiceClass } from '../ServiceClass';
import { IUser } from '../../../../definition/IUser';
import { E2EKeyPair } from './E2EKeyPair';
import { IRoom } from '../../../../definition/IRoom';
import { ISubscription } from '../../../../definition/ISubscription';

export interface IE2EService extends IServiceClass {
	getUserKeys(uid: IUser['_id']): Promise<E2EKeyPair | {}>;
	setUserKeys(uid: IUser['_id'], keyPair: E2EKeyPair): Promise<void>;
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
