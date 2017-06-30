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
		from: Match.Maybe(Date),
		to: Match.Maybe(Date)
	});

	const query = {};
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
	if (filter.from) {
		query.ts = {
			$gte: filter.from
		};
	}
	if (filter.to) {
		filter.to.setDate(filter.to.getDate() + 1);
		filter.to.setSeconds(filter.to.getSeconds() - 1);

		if (!query.ts) {
			query.ts = {};
		}
		query.ts.$lte = filter.to;
	}

	const self = this;

	const handle = RocketChat.models.Rooms.findLivechat(query, offset, limit).observeChanges({
		added(id, fields) {
			self.added('livechatRoom', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatRoom', id, fields);
		},
		removed(id) {
			self.removed('livechatRoom', id);
		}
	});

	this.ready();

	this.onStop(() => {
		handle.stop();
	});
});
