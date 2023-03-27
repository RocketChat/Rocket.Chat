import { Messages, Rooms } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';

import { Subscriptions } from '../../../models/server';
import { settings } from '../../../settings/server';

export const unarchiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.unarchiveById(rid);
	Subscriptions.unarchiveByRoomId(rid);
	await Messages.createWithTypeRoomIdMessageUserAndUnread('room-unarchived', rid, '', user, settings.get('ReadReceipt_Enabled'));
};
