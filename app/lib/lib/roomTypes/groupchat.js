/* globals openRoom */
import { Meteor } from 'meteor/meteor';

import { hasAllPermission, hasAtLeastOnePermission } from '../../../authorization';
import { ChatRoom } from '../../../models';
import { settings } from '../../../settings';
import { getUserPreference, RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext } from '../../../utils';


export class GroupChatRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'groupchat',
			path: '/groupchat/:name',
		});
	}

	action(params) {
		return openRoom('g', params.name);
	}
}

export class GroupChatRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'g',
			order: 50,
			label: 'Direct_Messages',
			route: new GroupChatRoute(),
		});
	}

	findRoom(identifier) {
		const query = {
			t: 'g',
			name: identifier,
		};

		return ChatRoom.findOne(query);
	}

	roomName(roomData) {
		if (settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}

		return roomData.name;
	}

	condition() {
		const user = Meteor.user();
		const roomsListExhibitionMode = getUserPreference(user, 'roomsListExhibitionMode');
		const mergeChannels = getUserPreference(user, 'mergeChannels');
		return !roomsListExhibitionMode || (['unread', 'category'].includes(roomsListExhibitionMode) && !mergeChannels && hasAllPermission('view-g-room'));
	}

	isGroupChat() {
		return true;
	}

	canAddUser(room) {
		return hasAtLeastOnePermission(['add-user-to-any-g-room', 'add-user-to-joined-room'], room._id);
	}

	allowRoomSettingChange(room, setting) {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
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
