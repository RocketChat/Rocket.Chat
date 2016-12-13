/* globals openRoom */

RocketChat.roomTypes.add('l', 5, {
	template: 'livechat',
	icon: 'icon-chat-empty',
	route: {
		name: 'live',
		path: '/live/:code(\\d+)',
		action(params/*, queryParams*/) {
			openRoom('l', params.code);
			RocketChat.TabBar.showGroup('livechat', 'search');
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
		let room = ChatRoom.findOne({ _id: roomId }, { fields: { open: 1 } });
		return room && room.open === true;
	},

	getUserStatus(roomId) {
		const room = Session.get('roomData' + roomId);
		if (!room) {
			return;
		}
		const subscription = RocketChat.models.Subscriptions.findOne({rid: roomId});
		if (!subscription) {
			return;
		}
		let guestName = _.without(room.usernames, subscription.u.username);
		if (guestName) {
			return Session.get('user_' + guestName + '_status');
		}
	},

	notSubscribedTpl: {
		template: 'livechatNotSubscribed'
	}
});
