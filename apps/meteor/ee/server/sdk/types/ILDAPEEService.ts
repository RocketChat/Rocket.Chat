import type { IUser } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

export interface ILDAPEEService {
	sync(): Promise<void>;
	syncAvatars(): Promise<void>;
	syncLogout(): Promise<void>;
	syncAbacAttributes(): Promise<void>;
	syncUsersAbacAttributes(users: FindCursor<IUser>): Promise<void>;
}
