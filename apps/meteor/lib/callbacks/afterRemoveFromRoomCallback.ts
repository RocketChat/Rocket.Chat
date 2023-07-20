import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const afterRemoveFromRoomCallback = Callbacks.create<{ removedUser: IUser; userWhoRemoved: IUser }, void, IRoom>(
	'afterRemoveFromRoom',
);
