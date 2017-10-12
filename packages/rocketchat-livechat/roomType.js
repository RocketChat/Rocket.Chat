/* globals openRoom, LivechatInquiry */

class LivechatRoomRoute extends RocketChat.definitions.RoomTypeRouteConfig {
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

class LivechatRoomType extends RocketChat.definitions.RoomTypeConfig {
	constructor() {
		super({
			identifier: 'l',
			order: 5,
			icon: 'livechat',
			label: 'Livechat',
			route: new LivechatRoomRoute()
		});

		this.notSubscribedTpl = {
			template: 'livechatNotSubscribed'
		};
	}

	findRoom(identifier) {
		return ChatRoom.findOne({ code: parseInt(identifier) });
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
		const room = ChatRoom.findOne({ _id: roomId }, { fields: { open: 1 } });
		return room && room.open === true;
	}

	getUserStatus(roomId) {
		let guestName;
		const room = Session.get(`roomData${ roomId }`);

		if (room) {
			guestName = room.v && room.v.username;
		} else {
			const inquiry = LivechatInquiry.findOne({ rid: roomId });
			guestName = inquiry && inquiry.v && inquiry.v.username;
		}

		if (guestName) {
			return Session.get(`user_${ guestName }_status`);
		}
	}
}

RocketChat.roomTypes.add(new LivechatRoomType());
