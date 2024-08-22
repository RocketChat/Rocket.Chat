import type { IUser, IRoom } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const afterLeaveRoomCallback = Callbacks.create<(user: IUser, room: IRoom) => void>('afterLeaveRoom');
