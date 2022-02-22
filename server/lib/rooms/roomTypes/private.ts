import { settings } from '../../../../app/settings/server';
import type { IRoom } from '../../../../definition/IRoom';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import type { ValueOf } from '../../../../definition/utils';
import { getPrivateRoomType } from '../../../../lib/rooms/roomTypes/private';
import { roomCoordinator } from '../roomCoordinator';

export const PrivateRoomType = getPrivateRoomType(roomCoordinator);

roomCoordinator.add(PrivateRoomType, {
	allowRoomSettingChange(room: IRoom, setting: ValueOf<typeof RoomSettingsEnum>): boolean {
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

	allowMemberAction(_room: IRoom, action: ValueOf<typeof RoomMemberActions>): boolean {
		switch (action) {
			case RoomMemberActions.BLOCK:
				return false;
			default:
				return true;
		}
	},

	roomName(room: IRoom): string | undefined {
		if (room.prid) {
			return room.fname;
		}
		if (settings.get('UI_Allow_room_names_with_special_chars')) {
			return room.fname || room.name;
		}

		return room.name;
	},

	isGroupChat(_room: IRoom): boolean {
		return true;
	},

	includeInDashboard(): boolean {
		return true;
	},
});
