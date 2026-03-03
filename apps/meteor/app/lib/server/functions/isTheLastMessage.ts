import type { IMessage, IRoom, AtLeast } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

export const isTheLastMessage = (room: AtLeast<IRoom, 'lastMessage'>, message: Pick<IMessage, '_id'>) =>
	settings.get('Store_Last_Message') && (!room.lastMessage || room.lastMessage._id === message._id);
