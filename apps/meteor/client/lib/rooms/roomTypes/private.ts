import type { AtLeast, IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import type { Mongo } from 'meteor/mongo';

import { hasPermission } from '../../../../app/authorization/client';
import { ChatRoom } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { getUserPreference } from '../../../../app/utils/client';
import { getRoomAvatarURL } from '../../../../app/utils/client/getRoomAvatarURL';
import type { IRoomTypeClientDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../../definition/IRoomTypeConfig';
import { getPrivateRoomType } from '../../../../lib/rooms/roomTypes/private';
import * as Federation from '../../federation/Federation';
import { roomCoordinator } from '../roomCoordinator';

export const PrivateRoomType = getPrivateRoomType(roomCoordinator);

roomCoordinator.add(
	{
		...PrivateRoomType,
		label: 'Private_Groups',
	},
	{
		allowRoomSettingChange(room, setting) {
			if (isRoomFederated(room as IRoom)) {
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

		allowMemberAction(_room, action, showingUserId, userSubscription) {
			if (isRoomFederated(_room as IRoom)) {
				return Federation.actionAllowed(_room, action, showingUserId, userSubscription);
			}
			switch (action) {
				case RoomMemberActions.BLOCK:
					return false;
				default:
					return true;
			}
		},

		roomName(roomData) {
			if (roomData.prid || isRoomFederated(roomData)) {
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
					return 'Hide_Group_Warning';
				case UiTextContext.LEAVE_WARNING:
					return 'Leave_Group_Warning';
				default:
					return '';
			}
		},

		condition() {
			const groupByType = getUserPreference(Meteor.userId(), 'sidebarGroupByType');
			return groupByType && hasPermission('view-p-room');
		},

		getAvatarPath(room) {
			return getRoomAvatarURL({ roomId: room._id, cache: room.avatarETag });
		},

		getIcon(room) {
			if (room.prid) {
				return 'discussion';
			}
			if (room.teamMain) {
				return 'team-lock';
			}

			if (isRoomFederated(room)) {
				return 'globe';
			}

			return 'hashtag-lock';
		},

		extractOpenRoomParams({ name }) {
			return { type: 'p', reference: name };
		},

		findRoom(identifier) {
			const query: Mongo.Selector<IRoom> = {
				t: 'p',
				name: identifier,
			};

			return ChatRoom.findOne(query);
		},
	} as AtLeast<IRoomTypeClientDirectives, 'isGroupChat' | 'roomName'>,
);
