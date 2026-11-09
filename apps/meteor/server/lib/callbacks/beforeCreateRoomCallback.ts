import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const beforeCreateRoomCallback =
	Callbacks.create<(data: { owner: IUser; room: Omit<IRoom, '_id' | '_updatedAt'>; members: string[] }) => void>('beforeCreateRoom');

export const prepareCreateRoomCallback =
	Callbacks.create<(data: { type: IRoom['t']; extraData: Partial<IRoom> }) => void>('prepareCreateRoom');
