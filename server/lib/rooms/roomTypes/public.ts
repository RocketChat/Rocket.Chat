import { settings } from '../../../../app/settings/server';
import type { IRoom, RoomType } from '../../../../definition/IRoom';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import type { AtLeast, ValueOf } from '../../../../definition/utils';
import { getPublicRoomType } from '../../../../lib/rooms/roomTypes/public';
import { roomCoordinator } from '../roomCoordinator';

export const PublicRoomType = getPublicRoomType(roomCoordinator);

roomCoordinator.add(PublicRoomType, {
	allowRoomSettingChange(room: IRoom, setting: ValueOf<typeof RoomSettingsEnum>): boolean {
		switch (setting) {
			case RoomSettingsEnum.BROADCAST:
				return Boolean(room.broadcast);
			case RoomSettingsEnum.READ_ONLY:
				return Boolean(!room.broadcast);
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
				return Boolean(!room.broadcast && room.ro);
			case RoomSettingsEnum.E2E:
				return false;
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

	roomName(room: IRoom, _userId?: string): string | undefined {
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

	getDiscussionType(): RoomType {
		return 'c';
	},

	includeInRoomSearch(): boolean {
		return true;
	},
} as AtLeast<IRoomTypeServerDirectives, 'isGroupChat' | 'roomName'>);
