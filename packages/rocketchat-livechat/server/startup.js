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
				livechatData: 1
			}
		});
	});
});
