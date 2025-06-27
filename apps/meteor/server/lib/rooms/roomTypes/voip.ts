import type { AtLeast } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { getVoipRoomType } from '../../../../lib/rooms/roomTypes/voip';
import { buildNotificationDetails } from '../buildNotificationDetails';
import { roomCoordinator } from '../roomCoordinator';

const VoipRoomType = getVoipRoomType(roomCoordinator);

roomCoordinator.add(VoipRoomType, {
	async roomName(room, _userId?) {
		return room.name || room.fname || (room as any).label;
	},

	async getNotificationDetails(room, sender, notificationMessage, userId, language) {
		return buildNotificationDetails({
			expectedNotificationMessage: notificationMessage,
			room,
			sender,
			expectedTitle: `[Omnichannel] ${await this.roomName(room, userId)}`,
			language,
			senderNameExpectedInMessage: false,
		});
	},

	async getMsgSender(message) {
		return Users.findOneById(message.u._id);
	},
} as AtLeast<IRoomTypeServerDirectives, 'roomName'>);
