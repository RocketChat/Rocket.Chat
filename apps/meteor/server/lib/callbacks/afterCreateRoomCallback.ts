import type { IUser, IRoom, MinimalApp } from '@rocket.chat/core-typings';

import { Callbacks } from './callbacksBase';

export const afterCreateRoomCallback = Callbacks.create<(data: { owner: IUser; room: IRoom; app?: MinimalApp }) => void>('afterCreateRoom');
