import { IRoom, isRoomFederated } from '@rocket.chat/core-typings';

import { Federation } from '../../../../app/federation-v2/server/infrastructure/rocket-chat/Federation';
import { settings } from '../../../../app/settings/server';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { getPrivateRoomType } from '../../../../lib/rooms/roomTypes/private';
import { roomCoordinator } from '../roomCoordinator';

export const PrivateRoomType = getPrivateRoomType(roomCoordinator);

roomCoordinator.add(PrivateRoomType, {
	allowRoomSettingChange(room, setting) {
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

	allowMemberAction(_room, action) {
		if (isRoomFederated(_room as IRoom)) {
			return Federation.actionAllowed(_room, action);
		}
		switch (action) {
			case RoomMemberActions.BLOCK:
				return false;
			default:
				return true;
		}
	},

	roomName(room, _userId?) {
		if (room.prid) {
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
