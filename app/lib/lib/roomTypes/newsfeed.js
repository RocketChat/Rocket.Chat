import { Meteor } from 'meteor/meteor';

import { ChatRoom, ChatSubscription } from '../../../models';
import { openRoom } from '../../../ui-utils';
import { settings } from '../../../settings';
import { hasAtLeastOnePermission, hasPermission } from '../../../authorization';
import { getUserPreference, RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext, roomTypes } from '../../../utils';
import { getRoomAvatarURL } from '../../../utils/lib/getRoomAvatarURL';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';

export class NewsfeedRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'newsfeed',
			path: '/newsfeed/:name',
		});
	}

	action(params) {
		return openRoom('n', params.name);
	}
}

export class NewsfeedRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'n',
			order: 30,
			icon: 'star',
			label: 'Newsfeed',
			route: new NewsfeedRoomRoute(),
		});
	}

	getIcon(roomData) {
		if (roomData.prid) {
			return 'discussion';
		}
		return this.icon;
	}

	findRoom(identifier) {
		const query = {
			t: 'n',
			name: identifier,
		};

		return ChatRoom.findOne(query);
	}

	roomName(roomData) {
		if (roomData.prid) {
			return roomData.fname;
		}
		if (settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}

		return roomData.name;
	}

	condition() {
		const groupByType = getUserPreference(Meteor.userId(), 'sidebarGroupByType');
		return groupByType && hasPermission('view-p-room');
	}

	isGroupChat() {
		return true;
	}

	canAddUser(room) {
		return hasAtLeastOnePermission(['add-user-to-any-p-room', 'add-user-to-joined-room'], room._id);
	}

	canSendMessage(roomId) {
		// TODO: remove duplicated code
		return ChatSubscription.find({
			rid: roomId,
		}).count() > 0;
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
				return settings.get('E2E_Enable') === true;
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

	getAvatarPath(roomData) {
		// TODO: change to always get avatar from _id when rooms have avatars

		// if room is not a discussion, returns the avatar for its name
		if (!roomData.prid) {
			return getAvatarURL({ username: `@${ this.roomName(roomData) }` });
		}

		// if discussion's parent room is known, get his avatar
		const proom = ChatRoom.findOne({ _id: roomData.prid }, { reactive: false });
		if (proom) {
			return roomTypes.getConfig(proom.t).getAvatarPath(proom);
		}

		// otherwise gets discussion's avatar via _id
		return getRoomAvatarURL(roomData.prid);
	}
}
