import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { ChatRoom, Subscriptions } from '../../../models';
import { openRoom } from '../../../ui-utils';
import { getUserPreference, RoomTypeConfig, RoomTypeRouteConfig, RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../utils';
import { hasPermission, hasAtLeastOnePermission } from '../../../authorization';
import { settings } from '../../../settings';
import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';

export class DirectMessageRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'direct',
			path: '/direct/:rid/:tab?/:context?',
		});
	}

	action(params) {
		return openRoom('d', params.rid);
	}

	link(sub) {
		return { rid: sub.rid || sub.name };
	}
}

export class DirectMessageRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'd',
			order: 50,
			icon: 'at',
			label: 'Direct_Messages',
			route: new DirectMessageRoomRoute(),
		});
	}


	getIcon(roomData) {
		if (this.isGroupChat(roomData)) {
			return 'balloon';
		}
		return this.icon;
	}

	findRoom(identifier) {
		if (!hasPermission('view-d-room')) {
			return null;
		}

		const query = {
			t: 'd',
			$or: [
				{ name: identifier },
				{ rid: identifier },
			],
		};

		const subscription = Subscriptions.findOne(query);
		if (subscription && subscription.rid) {
			return ChatRoom.findOne(subscription.rid);
		}
	}

	roomName(roomData) {
		// this function can receive different types of data
		// if it doesn't have fname and name properties, should be a Room object
		// so, need to find the related subscription
		const subscription = roomData && (roomData.fname || roomData.name)
			? roomData
			: Subscriptions.findOne({ rid: roomData._id });

		if (subscription === undefined) {
			return;
		}

		if (settings.get('UI_Use_Real_Name') && subscription.fname) {
			return subscription.fname;
		}

		return subscription.name;
	}

	secondaryRoomName(roomData) {
		if (settings.get('UI_Use_Real_Name')) {
			const subscription = Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1 } });
			return subscription && subscription.name;
		}
	}

	condition() {
		const groupByType = getUserPreference(Meteor.userId(), 'sidebarGroupByType');
		return groupByType && hasAtLeastOnePermission(['view-d-room', 'view-joined-room']);
	}

	getUserStatus(roomId) {
		const subscription = Subscriptions.findOne({ rid: roomId });
		if (subscription == null) {
			return;
		}

		return Session.get(`user_${ subscription.name }_status`);
	}

	getUserStatusText(roomId) {
		const subscription = Subscriptions.findOne({ rid: roomId });
		if (subscription == null) {
			return;
		}

		return Session.get(`user_${ subscription.name }_status_text`);
	}

	allowRoomSettingChange(room, setting) {
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
	}

	allowMemberAction(room, action) {
		switch (action) {
			case RoomMemberActions.BLOCK:
				return !this.isGroupChat(room);
			default:
				return false;
		}
	}

	enableMembersListProfile() {
		return true;
	}

	userDetailShowAll(/* room */) {
		return true;
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Private_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Private_Warning';
			default:
				return '';
		}
	}

	/**
	 * Returns details to use on notifications
	 *
	 * @param {object} room
	 * @param {object} user
	 * @param {string} notificationMessage
	 * @return {object} Notification details
	 */
	getNotificationDetails(room, user, notificationMessage) {
		if (!Meteor.isServer) {
			return {};
		}

		if (this.isGroupChat(room)) {
			return {
				title: this.roomName(room),
				text: `${ (settings.get('UI_Use_Real_Name') && user.name) || user.username }: ${ notificationMessage }`,
			};
		}

		return {
			title: (settings.get('UI_Use_Real_Name') && user.name) || user.username,
			text: notificationMessage,
		};
	}

	getAvatarPath(roomData, subData) {
		if (!roomData && !subData) {
			return '';
		}

		// if coming from sidenav search
		if (roomData.name && roomData.avatarETag) {
			return getUserAvatarURL(roomData.name, roomData.avatarETag);
		}

		if (this.isGroupChat(roomData)) {
			return getAvatarURL({ username: roomData.uids.length + roomData.usernames.join() });
		}

		const sub = subData || Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1 } });

		if (sub && sub.name) {
			const user = Meteor.users.findOne({ username: sub.name }, { fields: { username: 1, avatarETag: 1 } });
			return getUserAvatarURL(user?.username || sub.name, user?.avatarETag);
		}

		if (roomData) {
			return getUserAvatarURL(roomData.name || this.roomName(roomData)); // rooms should have no name for direct messages...
		}
	}

	includeInDashboard() {
		return true;
	}

	isGroupChat(room) {
		return room && room.uids && room.uids.length > 2;
	}
}
