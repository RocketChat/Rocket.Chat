import type { IRoom } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const beforeCreateRoomCallback =
	Callbacks.create<(data: { type: IRoom['t']; extraData: { encrypted?: boolean } }) => void>('beforeCreateRoom');
