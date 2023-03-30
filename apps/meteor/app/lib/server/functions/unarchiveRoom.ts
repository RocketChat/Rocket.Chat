import { Rooms } from '@rocket.chat/models';
import { Message } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';

import { Subscriptions } from '../../../models/server';

export const unarchiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
	await Message.saveSystemMessage('room-unarchived', rid, '', user);
};
