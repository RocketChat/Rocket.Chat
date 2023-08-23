import type { AtLeast } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { getVoipRoomType } from '../../../../lib/rooms/roomTypes/voip';
import { roomCoordinator } from '../roomCoordinator';

const VoipRoomType = getVoipRoomType(roomCoordinator);

roomCoordinator.add(VoipRoomType, {
	async roomName(room, _userId?) {
		return room.name || room.fname || (room as any).label;
	},

	async getNotificationDetails(room, _sender, notificationMessage, userId) {
		const title = `[Omnichannel] ${this.roomName(room, userId)}`;
		const text = notificationMessage;

		return { title, text };
	},

	async getMsgSender(senderId) {
		return Users.findOneById(senderId);
	},
} as AtLeast<IRoomTypeServerDirectives, 'roomName'>);
