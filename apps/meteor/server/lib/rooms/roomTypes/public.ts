import { Team } from '@rocket.chat/core-services';
import type { AtLeast, IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated, TEAM_TYPE } from '@rocket.chat/core-typings';

import { settings } from '../../../../app/settings/server';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { getPublicRoomType } from '../../../../lib/rooms/roomTypes/public';
import { Federation } from '../../../services/federation/Federation';
import { roomCoordinator } from '../roomCoordinator';

const PublicRoomType = getPublicRoomType(roomCoordinator);

roomCoordinator.add(PublicRoomType, {
	allowRoomSettingChange(room, setting) {
		if (isRoomFederated(room)) {
			return Federation.isRoomSettingAllowed(room, setting);
		}
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

	async getDiscussionType(room) {
		if (room?.teamId) {
			const team = await Team.getOneById(room.teamId, { projection: { type: 1 } });
			if (team?.type === TEAM_TYPE.PRIVATE) {
				return 'p';
			}
		}
		return 'c';
	},

	includeInRoomSearch() {
		return true;
	},
} as AtLeast<IRoomTypeServerDirectives, 'isGroupChat' | 'roomName'>);
