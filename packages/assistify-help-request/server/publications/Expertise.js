Meteor.publish('expertise', function (limit = 50) {
	if (typeof this.userId === 'undefined' || this.userId === null) {
		return this.ready();
	}

	const publication = this;

	const user = RocketChat.models.Users.findOneById(this.userId);

	if (typeof user === 'undefined' || user === null) {
		return this.ready();
	}

	return RocketChat.models.Rooms.findByType(
		'e',
		{
			sort: {ts: -1},
			limit: limit
		}
	)
});
