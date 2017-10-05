Meteor.publish('privateHistory', function() {
	if (!this.userId) {
		return this.ready();
	}

	return RocketChat.models.Rooms.findByContainingUsername(RocketChat.models.Users.findOneById(this.userId).username, {
		fields: {
			t: 1,
			name: 1,
			msgs: 1,
			ts: 1,
			lm: 1,
			cl: 1
		}
	});
});
