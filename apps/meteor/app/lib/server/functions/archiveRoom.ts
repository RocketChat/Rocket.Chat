import { Messages, Rooms } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';

import { Subscriptions } from '../../../models/server';
import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';

export const archiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.archiveById(rid);
	Subscriptions.archiveByRoomId(rid);
	await Messages.createWithTypeRoomIdMessageUserAndUnread('room-archived', rid, '', user, settings.get('ReadReceipt_Enabled'));

	callbacks.run('afterRoomArchived', await Rooms.findOneById(rid), user);
};
