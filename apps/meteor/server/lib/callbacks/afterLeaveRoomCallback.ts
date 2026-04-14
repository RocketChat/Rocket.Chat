import type { IUser, IRoom } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const afterLeaveRoomCallback = Callbacks.create<(data: { user: IUser; kicker?: IUser }, room: IRoom) => void>('afterLeaveRoom');
