import type { AtLeast } from '@rocket.chat/core-typings';

import { hasPermission } from '../../../../app/authorization/client';
import { ChatRoom } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { getAvatarURL } from '../../../../app/utils/client/getAvatarURL';
import type { IRoomTypeClientDirectives } from '../../../../definition/IRoomTypeConfig';
import { getVoipRoomType } from '../../../../lib/rooms/roomTypes/voip';
import { roomCoordinator } from '../roomCoordinator';

export const VoipRoomType = getVoipRoomType(roomCoordinator);

roomCoordinator.add(
	{
		...VoipRoomType,
		label: 'Voip',
	},
	{
		roomName(room) {
			return room.name || room.fname || (room as any).label;
		},

		condition() {
			return settings.get('Livechat_enabled') && hasPermission('view-l-room');
		},

		getAvatarPath(room) {
			return getAvatarURL({ username: `@${this.roomName(room)}` }) || '';
		},

		findRoom(identifier) {
			return ChatRoom.findOne({ _id: identifier });
		},

		canSendMessage(_rid) {
			return false;
		},

		readOnly(_rid, _user) {
			return true;
		},

		getIcon() {
			return 'phone';
		},

		extractOpenRoomParams({ id }) {
			return { type: 'v', reference: id };
		},
	} as AtLeast<IRoomTypeClientDirectives, 'roomName'>,
);
