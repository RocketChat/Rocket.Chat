import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const afterUnbanFromRoomCallback =
	Callbacks.create<(data: { unbannedUser: IUser; userWhoUnbanned: IUser }, room: IRoom) => void>('afterUnbanFromRoom');
