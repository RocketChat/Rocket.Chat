/* globals openRoom, LivechatInquiry */

RocketChat.roomTypes.add('l', 5, {
	icon: 'livechat',
	label: 'Livechat',
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
		const room = Session.get(`roomData${ roomId }`);

		if (room) {
			return room.v && room.v.status;
		} else {
			const inquiry = LivechatInquiry.findOne({ rid: roomId });
			return inquiry && inquiry.v && inquiry.v.status;
		}

		// if (guestName) {
		// 	return Session.get(`user_${ guestName }_status`);
		// }
	},

	notSubscribedTpl: {
		template: 'livechatNotSubscribed'
	}
});
