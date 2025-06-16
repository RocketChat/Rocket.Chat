import { Message } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { notifyOnRoomChangedById, notifyOnSubscriptionChangedByRoomId } from '../lib/notifyListener';

export const unarchiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.unarchiveById(rid);

	const unarchiveResponse = await Subscriptions.unarchiveByRoomId(rid);
	if (unarchiveResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

	await Message.saveSystemMessage('room-unarchived', rid, '', user);

	void notifyOnRoomChangedById(rid);
};
