import type { AtLeast } from '@rocket.chat/core-typings';

import { Users } from '../../../../app/models/server';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { getVoipRoomType } from '../../../../lib/rooms/roomTypes/voip';
import { roomCoordinator } from '../roomCoordinator';

export const VoipRoomType = getVoipRoomType(roomCoordinator);

roomCoordinator.add(VoipRoomType, {
	roomName(room, _userId?) {
		return room.name || room.fname || (room as any).label;
	},

	getNotificationDetails(room, _sender, notificationMessage, userId) {
		const title = `[Omnichannel] ${this.roomName(room, userId)}`;
		const text = notificationMessage;

		return { title, text };
	},

	getMsgSender(senderId) {
		return Users.findOneById(senderId);
	},
} as AtLeast<IRoomTypeServerDirectives, 'roomName'>);
