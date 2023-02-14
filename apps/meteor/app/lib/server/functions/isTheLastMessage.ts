import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const isTheLastMessage = (room: IRoom, message: IMessage) =>
	settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id);
