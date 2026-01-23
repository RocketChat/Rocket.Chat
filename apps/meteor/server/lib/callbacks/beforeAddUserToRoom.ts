import type { IUser, IRoom } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const beforeAddUserToRoom = Callbacks.create<(args: { user: IUser; inviter?: IUser }, room: IRoom) => void>('beforeAddUserToRoom');
export const beforeAddUsersToRoom =
	Callbacks.create<(args: { usernames: string[]; inviter?: IUser }, room: IRoom) => void>('beforeAddUsersToRoom');
