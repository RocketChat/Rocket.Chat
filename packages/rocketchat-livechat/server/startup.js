Meteor.startup(() => {

	RocketChat.roomTypes.setRoomFind('l', (code) => {
		return RocketChat.models.Rooms.findLivechatByCode(code);
	});

	RocketChat.authz.addRoomAccessValidator(function(room, user) {
		return room.t === 'l' && RocketChat.authz.hasPermission(user._id, 'view-livechat-rooms');
	});

	RocketChat.authz.addRoomAccessValidator(function(room, user) {
		return room.t === 'l' && room.v && room.v._id === user._id;
	});

	RocketChat.callbacks.add('beforeLeaveRoom', function(user, room) {
		if (room.t !== 'l') {
			return user;
		}
		throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
			lng: user.language || RocketChat.settings.get('language') || 'en'
		}));
	}, RocketChat.callbacks.priority.LOW, 'cant-leave-room');
});
