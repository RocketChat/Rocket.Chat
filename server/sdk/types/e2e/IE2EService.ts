import { IServiceClass } from '../ServiceClass';
import { IUser } from '../../../../definition/IUser';
import { E2EKeyPair } from './E2EKeyPair';
import { IRoom } from '../../../../definition/IRoom';

export interface IE2EService extends IServiceClass {
	getUserKeys(uid: IUser['_id']): Promise<E2EKeyPair | {}>;
	setUserKeys(uid: IUser['_id'], keyPair: E2EKeyPair): Promise<void>;
	getRoomMembersWithoutPublicKey(uid: IUser['_id'], rid: IRoom['_id']): Promise<IUser[]>;
	setRoomKeyId(uid: IUser['_id'], rid: IRoom['_id'], keyId: IRoom['e2eKeyId']): Promise<void>;
}
