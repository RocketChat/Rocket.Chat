import _ from 'underscore';

// settings endpoints
RocketChat.API.v1.addRoute('settings', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		let ourQuery = {
			hidden: { $ne: true }
		};

		if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
			ourQuery.public = true;
		}

		ourQuery = Object.assign({}, query, ourQuery);

		const settings = RocketChat.models.Settings.find(ourQuery, {
			sort: sort ? sort : { _id: 1 },
			skip: offset,
			limit: count,
			fields: Object.assign({ _id: 1, value: 1 }, fields)
		}).fetch();

		return RocketChat.API.v1.success({
			settings,
			count: settings.length,
			offset,
			total: RocketChat.models.Settings.find(ourQuery).count()
		});
	}
});

RocketChat.API.v1.addRoute('settings/:_id', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
			return RocketChat.API.v1.unauthorized();
		}

		return RocketChat.API.v1.success(_.pick(RocketChat.models.Settings.findOneNotHiddenById(this.urlParams._id), '_id', 'value'));
	},
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'edit-privileged-setting')) {
			return RocketChat.API.v1.unauthorized();
		}

		check(this.bodyParams, {
			value: Match.Any
		});

		if (RocketChat.models.Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value)) {
			return RocketChat.API.v1.success();
		}

		return RocketChat.API.v1.failure();
	}
});
