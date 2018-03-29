/* globals openRoom, LivechatInquiry */
import {RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext} from 'meteor/rocketchat:lib';

class LivechatRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'live',
			path: '/live/:code(\\d+)'
		});
	}

	action(params) {
		openRoom('l', params.code);
	}

	link(sub) {
		return {
			code: sub.code
		};
	}
}

class LivechatRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'l',
			order: 5,
			// icon: 'livechat',
			label: 'Livechat',
			route: new LivechatRoomRoute()
		});

		this.notSubscribedTpl = {
			template: 'livechatNotSubscribed'
		};
	}

	findRoom(identifier) {
		return ChatRoom.findOne({code: parseInt(identifier)});
	}

	roomName(roomData) {
		if (!roomData.name) {
			return roomData.label;
		} else {
			return roomData.name;
		}
	}

	condition() {
		return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-l-room');
	}

	canSendMessage(roomId) {
		const room = ChatRoom.findOne({_id: roomId}, {fields: {open: 1}});
		return room && room.open === true;
	}

	getUserStatus(roomId) {
		const room = Session.get(`roomData${ roomId }`);
		if (room) {
			return room.v && room.v.status;
		}

		const inquiry = LivechatInquiry.findOne({ rid: roomId });
		return inquiry && inquiry.v && inquiry.v.status;
	}

	allowRoomSettingChange(room, setting) {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			default:
				return true;
		}
	}

	getUiText(context) {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Livechat_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Hide_Livechat_Warning';
			default:
				return '';
		}
	}
}

RocketChat.roomTypes.add(new LivechatRoomType());
