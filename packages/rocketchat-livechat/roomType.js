/* globals openRoom, LivechatInquiry */

RocketChat.roomTypes.add('l', 5, {
	template: 'livechat',
	icon: 'icon-chat-empty',
	route: {
		name: 'live',
		path: '/live/:code(\\d+)',
		action(params/*, queryParams*/) {
			openRoom('l', params.code);
		},
		link(sub) {
			return {
				code: sub.code
			};
		}
	},

	findRoom(identifier) {
		return ChatRoom.findOne({ code: parseInt(identifier) });
	},

	roomName(roomData) {
		if (!roomData.name) {
			return roomData.label;
		} else {
			return roomData.name;
		}
	},

	condition() {
		return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-l-room');
	},

	canSendMessage(roomId) {
		const room = ChatRoom.findOne({ _id: roomId }, { fields: { open: 1 } });
		return room && room.open === true;
	},

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
	},

	notSubscribedTpl: {
		template: 'livechatNotSubscribed'
	}
});
