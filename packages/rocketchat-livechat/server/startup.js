Meteor.startup(() => {
	RocketChat.roomTypes.setPublish('l', (identifier) => {
		return RocketChat.models.Rooms.findByTypeAndName('l', identifier, {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				v: 1,
				livechatData: 1,
				topic: 1,
				tags: 1,
				sms: 1
			}
		});
	});

	RocketChat.authz.addRoomAccessValidator(function(room, user) {
		return room.t === 'l' && RocketChat.authz.hasPermission(user._id, 'view-livechat-rooms');
	});
});
