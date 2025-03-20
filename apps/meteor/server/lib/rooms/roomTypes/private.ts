import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { settings } from '../../../../app/settings/server';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { getPrivateRoomType } from '../../../../lib/rooms/roomTypes/private';
import { Federation } from '../../../services/federation/Federation';
import { roomCoordinator } from '../roomCoordinator';

const PrivateRoomType = getPrivateRoomType(roomCoordinator);

roomCoordinator.add(PrivateRoomType, {
	allowRoomSettingChange(room, setting) {
		if (isRoomFederated(room)) {
			return Federation.isRoomSettingAllowed(room, setting);
		}
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			case RoomSettingsEnum.BROADCAST:
				return Boolean(room.broadcast);
			case RoomSettingsEnum.READ_ONLY:
				return !room.broadcast;
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
				return Boolean(!room.broadcast && room.ro);
			case RoomSettingsEnum.E2E:
				return settings.get('E2E_Enable') === true;
			case RoomSettingsEnum.SYSTEM_MESSAGES:
			default:
				return true;
		}
	},

	async allowMemberAction(_room, action, userId) {
		if (isRoomFederated(_room as IRoom)) {
			return Federation.actionAllowed(_room, action, userId);
		}
		switch (action) {
			case RoomMemberActions.BLOCK:
				return false;
			default:
				return true;
		}
	},

	async roomName(room, _userId?) {
		if (room.prid || isRoomFederated(room)) {
			return room.fname;
		}
		if (settings.get('UI_Allow_room_names_with_special_chars')) {
			return room.fname || room.name;
		}

		return room.name;
	},

	isGroupChat(_room) {
		return true;
	},

	includeInDashboard() {
		return true;
	},
});
