import { Rooms } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';
import { Message } from '@rocket.chat/core-services';

import { Subscriptions } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';

export const archiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.archiveById(rid);
	Subscriptions.archiveByRoomId(rid);
	await Message.saveSystemMessage('room-archived', rid, '', user);

	callbacks.run('afterRoomArchived', await Rooms.findOneById(rid), user);
};
