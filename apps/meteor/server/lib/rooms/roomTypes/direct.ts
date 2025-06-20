import type { AtLeast } from '@rocket.chat/core-typings';
import { getUserDisplayName, isRoomFederated } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings/server';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import { getDirectMessageRoomType } from '../../../../lib/rooms/roomTypes/direct';
import { Federation } from '../../../services/federation/Federation';
import { buildNotificationDetails } from '../buildNotificationDetails';
import { roomCoordinator } from '../roomCoordinator';

const DirectMessageRoomType = getDirectMessageRoomType(roomCoordinator);

const getCurrentUserId = (): string | undefined => {
	try {
		return Meteor.userId() || undefined;
	} catch (_e) {
		//
	}
};

roomCoordinator.add(DirectMessageRoomType, {
	allowRoomSettingChange(_room, setting) {
		if (isRoomFederated(_room)) {
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

	async allowMemberAction(room, action, userId) {
		if (isRoomFederated(room)) {
			return Federation.actionAllowed(room, action, userId);
		}
		switch (action) {
			case RoomMemberActions.BLOCK:
				return !this.isGroupChat(room);
			default:
				return false;
		}
	},

	async roomName(room, userId?) {
		const subscription = await (async (): Promise<{ fname?: string; name?: string } | null> => {
			if (room.fname || room.name) {
				return {
					fname: room.fname,
					name: room.name,
				};
			}

			if (!room._id) {
				return null;
			}

			const uid = userId || getCurrentUserId();
			if (uid) {
				return Subscriptions.findOneByRoomIdAndUserId(room._id, uid, { projection: { name: 1, fname: 1 } });
			}

			// If we don't know what user is requesting the roomName, then any subscription will do
			return Subscriptions.findOne({ rid: room._id }, { projection: { name: 1, fname: 1 } });
		})();

		if (!subscription) {
			return;
		}

		if (settings.get('UI_Use_Real_Name') && room.fname) {
			return subscription.fname;
		}

		return subscription.name;
	},

	isGroupChat(room) {
		return (room?.uids?.length || 0) > 2;
	},

	async getNotificationDetails(room, sender, notificationMessage, userId, language) {
		const useRealName = settings.get<boolean>('UI_Use_Real_Name');
		const displayRoomName = await this.roomName(room, userId);
		const senderDisplayName = getUserDisplayName(sender.name, sender.username, useRealName);

		return buildNotificationDetails({
			expectedNotificationMessage: notificationMessage,
			room,
			sender,
			expectedTitle: this.isGroupChat(room) ? displayRoomName : senderDisplayName,
			language,
			senderNameExpectedInMessage: this.isGroupChat(room),
		});
	},

	includeInDashboard() {
		return true;
	},
} satisfies AtLeast<IRoomTypeServerDirectives, 'isGroupChat' | 'roomName'>);
