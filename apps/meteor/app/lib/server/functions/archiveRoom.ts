import { Message } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

export const archiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.archiveById(rid);
	await Subscriptions.archiveByRoomId(rid);
	await Message.saveSystemMessage('room-archived', rid, '', user);

	await callbacks.run('afterRoomArchived', await Rooms.findOneById(rid), user);
};
