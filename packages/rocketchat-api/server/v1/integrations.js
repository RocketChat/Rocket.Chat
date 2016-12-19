RocketChat.API.v1.addRoute('integrations.create', { authRequired: true }, {
	post: function() {
		try {
			check(this.bodyParams, Match.ObjectIncluding({
				type: String,
				name: String,
				enabled: Boolean,
				username: String,
				urls: [String],
				channel: Match.Maybe(String),
				triggerWords: Match.Maybe([String]),
				alias: Match.Maybe(String),
				avatar: Match.Maybe(String),
				emoji: Match.Maybe(String),
				token: Match.Maybe(String),
				scriptEnabled: Boolean,
				script: Match.Maybe(String)
			}));

			let integration;

			switch (this.bodyParams.type) {
				case 'webhook-outgoing':
					Meteor.runAsUser(this.userId, () => {
						integration = Meteor.call('addOutgoingIntegration', this.bodyParams);
					});
					break;
				default:
					return RocketChat.API.v1.failure('Invalid integration type.');
			}

			return RocketChat.API.v1.success({ integration });
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}
	}
});

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

RocketChat.API.v1.addRoute('integrations.remove', { authRequired: true }, {
	post: function() {
		try {
			check(this.bodyParams, Match.ObjectIncluding({
				type: String,
				target_url: Match.Maybe(String),
				integrationId: Match.Maybe(String)
			}));

			if (!this.bodyParams.target_url && !this.bodyParams.integrationId) {
				return RocketChat.API.v1.failure('An integrationId or target_url needs to be provided.');
			}

			switch (this.bodyParams.type) {
				case 'webhook-outgoing':
					let integration;

					if (this.bodyParams.target_url) {
						integration = RocketChat.models.Integrations.findOne({ urls: this.bodyParams.target_url }, { fields: { name: 1 } });
					} else if (this.bodyParams.integrationId) {
						integration = RocketChat.models.Integrations.findOneById(this.bodyParams.integrationId, { fields: { name: 1 } });
					}

					if (!integration) {
						return RocketChat.API.v1.failure('No integration found.');
					}

					Meteor.runAsUser(this.userId, () => {
						Meteor.call('deleteOutgoingIntegration', integration._id);
					});

					return RocketChat.API.v1.success({
						integrationId: integration._id
					});
				default:
					return RocketChat.API.v1.failure('Invalid integration type.');
			}
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}
	}
});
