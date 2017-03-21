RocketChat.API.v1.addRoute('integrations.create', { authRequired: true }, {
	post: function() {
		check(this.bodyParams, Match.ObjectIncluding({
			type: String,
			name: String,
			enabled: Boolean,
			username: String,
			urls: [String],
			channel: String,
			event: String,
			triggerWords: Match.Maybe([String]),
			alias: Match.Maybe(String),
			avatar: Match.Maybe(String),
			emoji: Match.Maybe(String),
			token: Match.Maybe(String),
			scriptEnabled: Boolean,
			script: Match.Maybe(String),
			targetChannel: Match.Maybe(String)
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
	}
});

RocketChat.API.v1.addRoute('integrations.history', { authRequired: true }, {
	get: function() {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			return RocketChat.API.v1.unauthorized();
		}

		if (!this.queryParams.id || this.queryParams.id.trim() === '') {
			return RocketChat.API.v1.failure('Invalid integration id.');
		}

		const id = this.queryParams.id;
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { 'integration._id': id });
		const history = RocketChat.models.IntegrationHistory.find(ourQuery, {
			sort: sort ? sort : { _updatedAt: -1 },
			skip: offset,
			limit: count,
			fields
		}).fetch();

		return RocketChat.API.v1.success({
			history,
			offset,
			items: history.length,
			total: RocketChat.models.IntegrationHistory.find(ourQuery).count()
		});
	}
});

RocketChat.API.v1.addRoute('integrations.list', { authRequired: true }, {
	get: function() {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			return RocketChat.API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query);
		const integrations = RocketChat.models.Integrations.find(ourQuery, {
			sort: sort ? sort : { ts: -1 },
			skip: offset,
			limit: count,
			fields
		}).fetch();

		return RocketChat.API.v1.success({
			integrations: integrations,
			offset,
			items: integrations.length,
			total: RocketChat.models.Integrations.find(ourQuery).count()
		});
	}
});

RocketChat.API.v1.addRoute('integrations.remove', { authRequired: true }, {
	post: function() {
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
					integration = RocketChat.models.Integrations.findOne({ urls: this.bodyParams.target_url });
				} else if (this.bodyParams.integrationId) {
					integration = RocketChat.models.Integrations.findOne({ _id: this.bodyParams.integrationId });
				}

				if (!integration) {
					return RocketChat.API.v1.failure('No integration found.');
				}

				Meteor.runAsUser(this.userId, () => {
					Meteor.call('deleteOutgoingIntegration', integration._id);
				});

				return RocketChat.API.v1.success({
					integration: integration
				});
			default:
				return RocketChat.API.v1.failure('Invalid integration type.');
		}
	}
});
