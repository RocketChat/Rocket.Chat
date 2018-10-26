/* globals openRoom */
import { RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext } from '../RoomTypeConfig';

export class PrivateRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'group',
			path: '/group/:name',
		});
	}

	action(params) {
		return openRoom('p', params.name);
	}
}

export class PrivateRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'p',
			order: 40,
			icon: 'lock',
			label: 'Private_Groups',
			route: new PrivateRoomRoute(),
		});
	}

	findRoom(identifier, user) {
		const query = {
			t: 'p',
			name: identifier,
			'u.username': user.username,
		};
		/**
		 * ChatRoom findOne is not synced after the subscribed user removed from the room.
		 * Therefore, it will always return value of the room. So validate the user subscription to the room.
		 */
		const subscription = RocketChat.models.Subscriptions.findOne(query);
		if (subscription && subscription.rid) {
			return ChatRoom.findOne(subscription.rid);
		}
	}

	roomName(roomData) {
		if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}

		return roomData.name;
	}

	condition() {
		const groupByType = RocketChat.getUserPreference(Meteor.userId(), 'sidebarGroupByType');
		return groupByType && RocketChat.authz.hasAllPermission('view-p-room');
	}

	isGroupChat() {
		return true;
	}

	canAddUser(room) {
		return RocketChat.authz.hasAtLeastOnePermission(['add-user-to-any-p-room', 'add-user-to-joined-room'], room._id);
	}

	allowRoomSettingChange(room, setting) {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			case RoomSettingsEnum.BROADCAST:
				return room.broadcast;
			case RoomSettingsEnum.READ_ONLY:
				return !room.broadcast;
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
				return !room.broadcast && room.ro;
			case RoomSettingsEnum.SYSTEM_MESSAGES:
			case RoomSettingsEnum.E2E:
				return RocketChat.settings.get('E2E_Enable') === true;
			default:
				return true;
		}
	}

	enableMembersListProfile() {
		return true;
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Group_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Group_Warning';
			default:
				return '';
		}
	}
	listInDirectory() {
		if (!RocketChat.authz.hasPermission(Meteor.user()._id, 'view-p-room' || !RocketChat.authz.hasAllPermission('view-outside-room'))) {
			return false;
		}
		return true;
	}
}
