import type { AtLeast } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../../app/settings/server';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { getVoipRoomType } from '../../../../lib/rooms/roomTypes/voip';
import { i18n } from '../../i18n';
import { roomCoordinator } from '../roomCoordinator';

const VoipRoomType = getVoipRoomType(roomCoordinator);

roomCoordinator.add(VoipRoomType, {
	async roomName(room, _userId?) {
		return room.name || room.fname || (room as any).label;
	},

	async getNotificationDetails(room, _sender, notificationMessage, userId, language) {
		const lng = language || settings.get('Language') || 'en';
		const showPushMessage = settings.get<boolean>('Push_show_message');
		const showUserOrRoomName = settings.get<boolean>('Push_show_username_room');

		let roomName;
		let text;
		let title;

		if (showPushMessage) {
			text = notificationMessage;
		} else {
			text = i18n.t('You_have_a_new_message', { lng });
		}

		if (showUserOrRoomName) {
			roomName = await this.roomName(room, userId);
			title = `[Omnichannel] ${roomName}`;
		}

		return { title, text, name: roomName };
	},

	async getMsgSender(message) {
		return Users.findOneById(message.u._id);
	},
} as AtLeast<IRoomTypeServerDirectives, 'roomName'>);
