import type { AtLeast, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import type { Mongo } from 'meteor/mongo';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { Subscriptions, Users, Rooms } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { getUserPreference } from '../../../../app/utils/client';
import { getAvatarURL } from '../../../../app/utils/client/getAvatarURL';
import { getUserAvatarURL } from '../../../../app/utils/client/getUserAvatarURL';
import type { IRoomTypeClientDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../../definition/IRoomTypeConfig';
import { getDirectMessageRoomType } from '../../../../lib/rooms/roomTypes/direct';
import * as Federation from '../../federation/Federation';
import { roomCoordinator } from '../roomCoordinator';

export const DirectMessageRoomType = getDirectMessageRoomType(roomCoordinator);

roomCoordinator.add(
	{
		...DirectMessageRoomType,
		label: 'Direct_Messages',
	},
	{
		allowRoomSettingChange(_room, setting) {
			if (isRoomFederated(_room as IRoom)) {
				return Federation.isRoomSettingAllowed(_room, setting);
			}
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

		allowMemberAction(room, action, showingUserId, userSubscription) {
			if (isRoomFederated(room as IRoom)) {
				return Federation.actionAllowed(room, action, showingUserId, userSubscription);
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
				const user = Users.findOne({ username: sub.name }, { fields: { username: 1, avatarETag: 1 } }) as IUser | undefined;
				return getUserAvatarURL(user?.username || sub.name, user?.avatarETag);
			}

			return getUserAvatarURL(room.name || this.roomName(room) || '');
		},

		getIcon(room) {
			if (isRoomFederated(room)) {
				return 'globe';
			}

			if (this.isGroupChat(room)) {
				return 'balloon';
			}

			return 'at';
		},

		extractOpenRoomParams({ rid }) {
			return { type: 'd', reference: rid };
		},

		findRoom(identifier) {
			const query: Mongo.Selector<ISubscription> = {
				t: 'd',
				$or: [{ name: identifier }, { rid: identifier }],
			};

			const subscription = Subscriptions.findOne(query);
			if (subscription?.rid) {
				return Rooms.findOne(subscription.rid);
			}
		},
	} as AtLeast<IRoomTypeClientDirectives, 'isGroupChat' | 'roomName'>,
);
