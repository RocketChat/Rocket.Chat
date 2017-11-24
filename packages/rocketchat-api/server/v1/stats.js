RocketChat.API.v1.addRoute('statistics', { authRequired: true }, {
	get() {
		let refresh = false;
		if (typeof this.queryParams.refresh !== 'undefined' && this.queryParams.refresh === 'true') {
			refresh = true;
		}

		let stats;
		Meteor.runAsUser(this.userId, () => {
			stats = Meteor.call('getStatistics', refresh);
		});

		return RocketChat.API.v1.success({
			statistics: stats
		});
	}
});

RocketChat.API.v1.addRoute('statistics.list', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-statistics')) {
			return RocketChat.API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const statistics = RocketChat.models.Statistics.find(query, {
			sort: sort ? sort : { name: 1 },
			skip: offset,
			limit: count,
			fields
		}).fetch();

		return RocketChat.API.v1.success({
			statistics,
			count: statistics.length,
			offset,
			total: RocketChat.models.Statistics.find(query).count()
		});
	}
});
