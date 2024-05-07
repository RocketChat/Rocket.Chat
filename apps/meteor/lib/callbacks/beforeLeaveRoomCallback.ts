import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const beforeLeaveRoomCallback = Callbacks.create<(user: IUser, room: IRoom) => void>('beforeLeaveRoom');
