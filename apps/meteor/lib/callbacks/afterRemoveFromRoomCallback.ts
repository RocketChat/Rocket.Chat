import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const afterRemoveFromRoomCallback =
	Callbacks.create<(data: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom) => void>('afterRemoveFromRoom');
