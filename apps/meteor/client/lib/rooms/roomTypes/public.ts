import type { AtLeast } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { ChatRoom } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { getUserPreference } from '../../../../app/utils/client';
import { getAvatarURL } from '../../../../app/utils/lib/getAvatarURL';
import type { IRoomTypeClientDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../../definition/IRoomTypeConfig';
import { getPublicRoomType } from '../../../../lib/rooms/roomTypes/public';
import { roomCoordinator } from '../roomCoordinator';

export const PublicRoomType = getPublicRoomType(roomCoordinator);

roomCoordinator.add(PublicRoomType, {
	allowRoomSettingChange(room, setting) {
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

	allowMemberAction(_room, action) {
		switch (action) {
			case RoomMemberActions.BLOCK:
				return false;
			default:
				return true;
		}
	},

	roomName(roomData) {
		if (roomData.prid) {
			return roomData.fname;
		}
		if (settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}
		return roomData.name;
	},

	isGroupChat(_room) {
		return true;
	},

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Room_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Room_Warning';
			default:
				return '';
		}
	},

	condition() {
		const groupByType = getUserPreference(Meteor.userId(), 'sidebarGroupByType');
		return (
			groupByType && (hasAtLeastOnePermission(['view-c-room', 'view-joined-room']) || settings.get('Accounts_AllowAnonymousRead') === true)
		);
	},

	getAvatarPath(room) {
		return getAvatarURL({ roomId: room._id, cache: room.avatarETag }) as string;
	},

	getIcon(room) {
		if (room.prid) {
			return 'discussion';
		}
		if (room.teamMain) {
			return 'team';
		}

		return PublicRoomType.icon;
	},

	findRoom(identifier) {
		const query = {
			t: 'c',
			name: identifier,
		};

		return ChatRoom.findOne(query);
	},

	showJoinLink(roomId) {
		return !!ChatRoom.findOne({ _id: roomId, t: 'c' });
	},
} as AtLeast<IRoomTypeClientDirectives, 'isGroupChat' | 'roomName'>);
