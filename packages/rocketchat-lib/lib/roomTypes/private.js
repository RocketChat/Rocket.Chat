/* globals openRoom */
import {RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext} from '../RoomTypeConfig';

export class PrivateRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'group',
			path: '/group/:name'
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
			route: new PrivateRoomRoute()
		});
	}

	findRoom(identifier) {
		const query = {
			t: 'p',
			name: identifier
		};

		return ChatRoom.findOne(query);
	}

	roomName(roomData) {
		if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}

		return roomData.name;
	}

	condition() {
		const user = Meteor.user();
		const mergeChannels = RocketChat.getUserPreference(user, 'mergeChannels');
		return !mergeChannels && RocketChat.authz.hasAllPermission('view-p-room');
	}

	isGroupChat() {
		return true;
	}

	canAddUser(room) {
		return RocketChat.authz.hasAtLeastOnePermission(['add-user-to-any-p-room', 'add-user-to-joined-room'], room._id);
	}

	allowRoomSettingChange(room, setting) {
		switch (setting) {
			case RoomSettingsEnum.BROADCAST:
				return room.broadcast;
			case RoomSettingsEnum.READ_ONLY:
				return !room.broadcast;
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
				return !room.broadcast && room.ro;
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
}
