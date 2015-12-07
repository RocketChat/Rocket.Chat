Meteor.publish('livechat:visitorRoom', function(visitorToken) {
	console.log('[publish] livechat:visitorRoom -> '.green, 'arguments:', arguments);

	return RocketChat.models.Rooms.findByVisitorToken(visitorToken, {
		fields: {
			name: 1,
			t: 1,
			cl: 1,
			u: 1,
			usernames: 1,
			v: 1
		}
	});
});
