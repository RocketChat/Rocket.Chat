import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings/server';
import type { IRoom } from '../../../../definition/IRoom';
import type { IUser } from '../../../../definition/IUser';
import type { IRoomTypeServerDirectives } from '../../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions } from '../../../../definition/IRoomTypeConfig';
import type { AtLeast, ValueOf } from '../../../../definition/utils';
import { getDirectMessageRoomType } from '../../../../lib/rooms/roomTypes/direct';
import { roomCoordinator } from '../roomCoordinator';
import { Subscriptions } from '../../../../app/models/server';

export const DirectMessageRoomType = getDirectMessageRoomType(roomCoordinator);

const getCurrentUserId = (): string | undefined => {
	try {
		return Meteor.userId() || undefined;
	} catch (_e) {
		//
	}
};

roomCoordinator.add(DirectMessageRoomType, {
	allowRoomSettingChange(_room: IRoom, setting: ValueOf<typeof RoomSettingsEnum>): boolean {
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

	allowMemberAction(room: IRoom, action: ValueOf<typeof RoomMemberActions>): boolean {
		switch (action) {
			case RoomMemberActions.BLOCK:
				return !this.isGroupChat(room);
			default:
				return false;
		}
	},

	roomName(room: IRoom, userId?: string): string | undefined {
		const subscription = ((): { fname?: string; name?: string } | undefined => {
			if (room.fname || room.name) {
				return {
					fname: room.fname,
					name: room.name,
				};
			}

			if (!room._id) {
				return undefined;
			}

			const uid = userId || getCurrentUserId();
			if (uid) {
				return Subscriptions.findOneByRoomIdAndUserId(room._id, uid);
			}

			// If we don't know what user is requesting the roomName, then any subscription will do
			return Subscriptions.findOne({ rid: room._id });
		})();

		if (!subscription) {
			return;
		}

		if (settings.get('UI_Use_Real_Name') && room.fname) {
			return subscription.fname;
		}

		return subscription.name;
	},

	isGroupChat(room: IRoom): boolean {
		return (room?.uids?.length || 0) > 2;
	},

	getNotificationDetails(
		room: IRoom,
		sender: AtLeast<IUser, '_id' | 'name' | 'username'>,
		notificationMessage: string,
		userId?: string,
	): { title: string | undefined; text: string } {
		const useRealName = settings.get<boolean>('UI_Use_Real_Name');

		if (this.isGroupChat(room)) {
			return {
				title: this.roomName(room, userId),
				text: `${(useRealName && sender.name) || sender.username}: ${notificationMessage}`,
			};
		}

		return {
			title: (useRealName && sender.name) || sender.username,
			text: notificationMessage,
		};
	},

	includeInDashboard(): boolean {
		return true;
	},
} as AtLeast<IRoomTypeServerDirectives, 'isGroupChat' | 'roomName'>);
