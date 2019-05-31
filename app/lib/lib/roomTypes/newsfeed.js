import { Meteor } from 'meteor/meteor';

import { openRoom } from '../../../ui-utils';
import { ChatRoom, ChatSubscription } from '../../../models';
import { settings } from '../../../settings';
import { hasAtLeastOnePermission } from '../../../authorization';
import { getUserPreference, RoomTypeConfig, RoomTypeRouteConfig, RoomSettingsEnum, UiTextContext } from '../../../utils';
import { getAvatarURL } from '../../../utils/lib/getAvatarURL';

export class NewsfeedRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'newsfeed',
			path: '/newsfeed/',
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
			icon: 'hashtag',
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
		return groupByType && (hasAtLeastOnePermission(['view-c-room', 'view-joined-room']) || settings.get('Accounts_AllowAnonymousRead') === true);
	}

	showJoinLink(roomId) {
		return !!ChatRoom.findOne({ _id: roomId, t: 'n' });
	}

	includeInRoomSearch() {
		return true;
	}

	isGroupChat() {
		return true;
	}

	canAddUser(room) {
		return hasAtLeastOnePermission(['add-user-to-any-c-room', 'add-user-to-joined-room'], room._id);
	}

	canSendMessage(roomId) {
		const room = ChatRoom.findOne({ _id: roomId, t: 'c' }, { fields: { prid: 1 } });
		if (room.prid) {
			return true;
		}

		// TODO: remove duplicated code
		return ChatSubscription.find({
			rid: roomId,
		}).count() > 0;
	}

	enableMembersListProfile() {
		return true;
	}

	allowRoomSettingChange(room, setting) {
		switch (setting) {
			case RoomSettingsEnum.BROADCAST:
				return room.broadcast;
			case RoomSettingsEnum.READ_ONLY:
				return !room.broadcast;
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
				return !room.broadcast && room.ro;
			case RoomSettingsEnum.E2E:
				return false;
			case RoomSettingsEnum.SYSTEM_MESSAGES:
			default:
				return true;
		}
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Room_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Room_Warning';
			default:
				return '';
		}
	}

	getAvatarPath(roomData) {
		// TODO: change to always get avatar from _id when rooms have avatars

		return getAvatarURL({ username: `@${ this.roomName(roomData) }` });
	}
}
