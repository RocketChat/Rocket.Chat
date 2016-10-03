Meteor.publish('livechat:visitorRoom', function(visitorToken, roomId) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:visitorInfo' }));
	}

	let rooms = RocketChat.models.Rooms.find({
		'v.token': visitorToken,
		_id: roomId
	}, {
		fields: {
			_id: 1,
			state: 1
		}
	});

	if (rooms.count() > 0) {
		return rooms;
	} else {
		this.ready();
	}
});