import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

export const archiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.archiveById(rid);
	await Subscriptions.archiveByRoomId(rid);
	await Messages.createWithTypeRoomIdMessageUserAndUnread('room-archived', rid, '', user, settings.get('Message_Read_Receipt_Enabled'));

	callbacks.run('afterRoomArchived', await Rooms.findOneById(rid), user);
};
