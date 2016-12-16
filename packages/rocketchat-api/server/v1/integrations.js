RocketChat.API.v1.addRoute('integrations.list', { authRequired: true }, {
	get: function() {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			let page = 1;
			if (typeof this.queryParams.page !== 'undefined') {
				page = parseInt(this.queryParams.page);
			}

			let limit = 20;
			if (typeof this.queryParams.limit !== 'undefined') {
				limit = parseInt(this.queryParams.limit);
			}

			const integrations = RocketChat.models.Integrations.find({}, { limit: limit, skip: (page - 1) * limit }).fetch();
			return RocketChat.API.v1.success({
				integrations: integrations,
				page: page,
				items: integrations.length,
				total: RocketChat.models.Integrations.find().count()
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}
	}
});
