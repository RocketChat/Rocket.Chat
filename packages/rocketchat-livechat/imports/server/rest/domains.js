RocketChat.API.v1.addRoute('livechat/domains', { authRequired: true }, {
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			check(this.bodyParams, { domain: String });
			return RocketChat.API.v1.success(RocketChat.Livechat.addValidDomain(this.bodyParams.domain));
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	},

	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			return RocketChat.API.v1.success({
				users: RocketChat.models.LivechatValidDomains.find().fetch().map(d => ({ _id: d._id, domain: d.domain }))
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	}
});

RocketChat.API.v1.addRoute('livechat/domains/:_id', { authRequired: true }, {
	delete() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			check(this.urlParams, { _id: String });
			if (RocketChat.Livechat.removeValidDomain(this.urlParams._id)) {
				return RocketChat.API.v1.success();
			}
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	},

	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		try {
			check(this.urlParams, { _id: String });
			let domain = RocketChat.models.LivechatValidDomains.findOneById(this.urlParams._id);

			if (domain) {
				return RocketChat.API.v1.success({
					domain: _.pick(domain, '_id', 'domain')
				});
			}

			return RocketChat.API.v1.failure();
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	}
});