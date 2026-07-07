import { Message } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { notifyOnRoomChanged, notifyOnSubscriptionChangedByRoomId } from '../../../app/lib/server/lib/notifyListener';
import { callbacks } from '../callbacks';

export const archiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.archiveById(rid);

	const archiveResponse = await Subscriptions.archiveByRoomId(rid);
	if (archiveResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

	await Message.saveSystemMessage('room-archived', rid, '', user);

	const room = await Rooms.findOneById(rid);

	await callbacks.run('afterRoomArchived', room, user);

	if (room) {
		void notifyOnRoomChanged(room);
	}
};
