import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { RoomTypeConfig, RoomTypeRouteConfig, RoomSettingsEnum, UiTextContext } from '../RoomTypeConfig';
import { ChatRoom } from 'meteor/rocketchat:models';

export class DirectMessageRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'direct',
			path: '/direct/:username',
		});
	}

	action(params) {
		return openRoom('d', params.username);
	}

	link(sub) {
		return { username: sub.name };
	}
}

export class DirectMessageRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'd',
			order: 50,
			label: 'Direct_Messages',
			route: new DirectMessageRoomRoute(),
		});
	}

	findRoom(identifier) {
		if (!RocketChat.authz.hasPermission('view-d-room')) {
			return null;
		}

		const query = {
			t: 'd',
			name: identifier,
		};

		const subscription = RocketChat.models.Subscriptions.findOne(query);
		if (subscription && subscription.rid) {
			return ChatRoom.findOne(subscription.rid);
		}
	}

	roomName(roomData) {
		const subscription = RocketChat.models.Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1, fname: 1 } });
		if (!subscription) {
			return '';
		}

		if (RocketChat.settings.get('UI_Use_Real_Name') && subscription.fname) {
			return subscription.fname;
		}

		return subscription.name;
	}

	secondaryRoomName(roomData) {
		if (RocketChat.settings.get('UI_Use_Real_Name')) {
			const subscription = RocketChat.models.Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1 } });
			return subscription && subscription.name;
		}
	}

	condition() {
		const groupByType = RocketChat.getUserPreference(Meteor.userId(), 'sidebarGroupByType');
		return groupByType && RocketChat.authz.hasAtLeastOnePermission(['view-d-room', 'view-joined-room']);
	}

	getUserStatus(roomId) {
		const subscription = RocketChat.models.Subscriptions.findOne({ rid: roomId });
		if (subscription == null) {
			return;
		}

		return Session.get(`user_${ subscription.name }_status`);
	}

	getDisplayName(room) {
		return room.usernames.join(' x ');
	}

	allowRoomSettingChange(room, setting) {
		switch (setting) {
			case RoomSettingsEnum.NAME:
			case RoomSettingsEnum.SYSTEM_MESSAGES:
			case RoomSettingsEnum.DESCRIPTION:
			case RoomSettingsEnum.READ_ONLY:
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
			case RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE:
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			case RoomSettingsEnum.E2E:
				return RocketChat.settings.get('E2E_Enable') === true;
			default:
				return true;
		}
	}

	enableMembersListProfile() {
		return true;
	}

	userDetailShowAll(/* room */) {
		return false;
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

		const title = RocketChat.settings.get('UI_Use_Real_Name') ? user.name : `@${ user.username }`;
		const text = notificationMessage;

		return { title, text };
	}
}
