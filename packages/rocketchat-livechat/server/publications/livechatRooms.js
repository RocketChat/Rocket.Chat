Meteor.publish('livechat:rooms', function(filter = {}, offset = 0, limit = 20) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:rooms' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:rooms' }));
	}

	check(filter, {
		name: Match.Maybe(String), // room name to filter
		agent: Match.Maybe(String), // agent _id who is serving
		status: Match.Maybe(String), // either 'opened' or 'closed'
		from: Match.Maybe(String),
		to: Match.Maybe(String)
	});

	let query = {};
	if (filter.name) {
		query.label = new RegExp(filter.name, 'i');
	}
	if (filter.agent) {
		query['servedBy._id'] = filter.agent;
	}
	if (filter.status) {
		if (filter.status === 'opened') {
			query.open = true;
		} else {
			query.open = { $exists: false };
		}
	}
	if (filter.from && filter.to) {
		var StartDate = new Date(filter.from);
		var ToDate = new Date(filter.to);
		ToDate.setDate(ToDate.getDate() + 1);
		query['ts'] = { $gt: StartDate, $lt: ToDate };
	}

	return RocketChat.models.Rooms.findLivechat(query, offset, limit);
});
