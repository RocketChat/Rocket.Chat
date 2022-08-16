import type { AtLeast, IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import * as Federation from '../../../../app/federation-v2/client/Federation';
import { Subscriptions, Users, ChatRoom } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { getUserPreference } from '../../../../app/utils/client';
import { getAvatarURL } from '../../../../app/utils/lib/getAvatarURL';
import { getUserAvatarURL } from '../../../../app/utils/lib/getUserAvatarURL';
import type { IRoomTypeClientDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../../definition/IRoomTypeConfig';
import { getDirectMessageRoomType } from '../../../../lib/rooms/roomTypes/direct';
import { roomCoordinator } from '../roomCoordinator';

export const DirectMessageRoomType = getDirectMessageRoomType(roomCoordinator);

roomCoordinator.add(DirectMessageRoomType, {
	allowRoomSettingChange(_room, setting) {
		switch (setting) {
			case RoomSettingsEnum.TYPE:
			case RoomSettingsEnum.NAME:
			case RoomSettingsEnum.SYSTEM_MESSAGES:
			case RoomSettingsEnum.DESCRIPTION:
			case RoomSettingsEnum.READ_ONLY:
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
			case RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE:
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			case RoomSettingsEnum.E2E:
				return settings.get('E2E_Enable') === true;
			default:
				return true;
		}
	},

	allowMemberAction(room, action) {
		if (isRoomFederated(room as IRoom)) {
			return Federation.actionAllowed(room, action);
		}
		switch (action) {
			case RoomMemberActions.BLOCK:
				return !this.isGroupChat(room);
			default:
				return false;
		}
	},

	roomName(roomData) {
		const subscription = ((): { fname?: string; name?: string } | undefined => {
			if (roomData.fname || roomData.name) {
				return {
					fname: roomData.fname,
					name: roomData.name,
				};
			}

			if (!roomData._id) {
				return undefined;
			}

			return Subscriptions.findOne({ rid: roomData._id });
		})();

		if (!subscription) {
			return;
		}

		if (settings.get('UI_Use_Real_Name') && subscription.fname) {
			return subscription.fname;
		}

		return subscription.name;
	},

	isGroupChat(room) {
		return (room?.uids?.length || 0) > 2;
	},

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Private_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Private_Warning';
			default:
				return '';
		}
	},

	condition() {
		const groupByType = getUserPreference(Meteor.userId(), 'sidebarGroupByType');
		return groupByType && hasAtLeastOnePermission(['view-d-room', 'view-joined-room']);
	},

	getAvatarPath(room) {
		if (!room) {
			return '';
		}

		// if coming from sidenav search
		if (room.name && room.avatarETag) {
			return getUserAvatarURL(room.name, room.avatarETag);
		}

		if (this.isGroupChat(room)) {
			return getAvatarURL({
				username: (room.uids || []).length + (room.usernames || []).join(),
				cache: room.avatarETag,
			}) as string;
		}

		const sub = Subscriptions.findOne({ rid: room._id }, { fields: { name: 1 } });
		if (sub?.name) {
			const user = Users.findOne({ username: sub.name }, { fields: { username: 1, avatarETag: 1 } });
			return getUserAvatarURL(user?.username || sub.name, user?.avatarETag);
		}

		return getUserAvatarURL(room.name || this.roomName(room));
	},

	getIcon(room) {
		if (this.isGroupChat(room)) {
			return 'balloon';
		}

		return DirectMessageRoomType.icon;
	},

	getUserStatus(roomId) {
		const subscription = Subscriptions.findOne({ rid: roomId });
		if (!subscription) {
			return;
		}

		return Session.get(`user_${subscription.name}_status`);
	},

	findRoom(identifier) {
		const query = {
			t: 'd',
			$or: [{ name: identifier }, { rid: identifier }],
		};

		const subscription = Subscriptions.findOne(query);
		if (subscription?.rid) {
			return ChatRoom.findOne(subscription.rid);
		}
	},
} as AtLeast<IRoomTypeClientDirectives, 'isGroupChat' | 'roomName'>);
