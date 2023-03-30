import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

export const unarchiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.unarchiveById(rid);
	await Subscriptions.unarchiveByRoomId(rid);
	await Messages.createWithTypeRoomIdMessageUserAndUnread('room-unarchived', rid, '', user, settings.get('Message_Read_Receipt_Enabled'));
};
