import { Message } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { notifyOnRoomChangedById } from '../lib/notifyListener';

export const unarchiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.unarchiveById(rid);
	await Subscriptions.unarchiveByRoomId(rid);
	await Message.saveSystemMessage('room-unarchived', rid, '', user);

	void notifyOnRoomChangedById(rid);
};
