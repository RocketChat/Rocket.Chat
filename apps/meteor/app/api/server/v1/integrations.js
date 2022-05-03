import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasAtLeastOnePermission } from '../../../authorization/server';
import { Integrations, IntegrationHistory } from '../../../models/server/raw';
import { API } from '../api';
import {
	mountIntegrationHistoryQueryBasedOnPermissions,
	mountIntegrationQueryBasedOnPermissions,
} from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { findOneIntegration } from '../lib/integrations';

API.v1.addRoute(
	'integrations.create',
	{ authRequired: true },
	{
		post() {
			const { userId, bodyParams } = this;

			check(
				bodyParams,
				Match.ObjectIncluding({
					type: String,
					name: String,
					enabled: Boolean,
					username: String,
					urls: Match.Maybe([String]),
					channel: String,
					event: Match.Maybe(String),
					triggerWords: Match.Maybe([String]),
					alias: Match.Maybe(String),
					avatar: Match.Maybe(String),
					avatarUrl: Match.Maybe(String),
					emoji: Match.Maybe(String),
					token: Match.Maybe(String),
					scriptEnabled: Boolean,
					script: Match.Maybe(String),
					targetRoom: Match.Maybe(String),
					impersonateUser: Match.Maybe(Boolean),
					retryCount: Match.Maybe(Number),
					retryDelay: Match.Maybe(String),
					retryFailedCalls: Match.Maybe(Boolean),
					runOnEdits: Match.Maybe(Boolean),
					triggerWordAnywhere: Match.Maybe(Boolean),
				}),
			);

			let integration;

			switch (bodyParams.type) {
				case 'webhook-outgoing':
					Meteor.runAsUser(userId, () => {
						integration = Meteor.call('addOutgoingIntegration', bodyParams);
					});
					break;
				case 'webhook-incoming':
					Meteor.runAsUser(userId, () => {
						integration = Meteor.call('addIncomingIntegration', bodyParams);
					});
					break;
				default:
					return API.v1.failure('Invalid integration type.');
			}

			return API.v1.success({ integration });
		},
	},
);

API.v1.addRoute(
	'integrations.history',
	{ authRequired: true },
	{
		get() {
			const { userId, queryParams } = this;

			if (!hasAtLeastOnePermission(userId, ['manage-outgoing-integrations', 'manage-own-outgoing-integrations'])) {
				return API.v1.unauthorized();
			}

			check(
				queryParams,
				Match.ObjectIncluding({
					id: String,
				}),
			);

			if (!queryParams.id || queryParams.id.trim() === '') {
				return API.v1.failure('Invalid integration id.');
			}

			const { id } = queryParams;
			const { offset, count } = this.getPaginationItems();
			const { sort, fields: projection, query } = this.parseJsonQuery();
			const ourQuery = Object.assign(mountIntegrationHistoryQueryBasedOnPermissions(userId, id), query);

			const cursor = IntegrationHistory.find(ourQuery, {
				sort: sort || { _updatedAt: -1 },
				skip: offset,
				limit: count,
				projection,
			});

			const history = Promise.await(cursor.toArray());
			const total = Promise.await(cursor.count());

			return API.v1.success({
				history,
				offset,
				items: history.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'integrations.list',
	{ authRequired: true },
	{
		get() {
			if (
				!hasAtLeastOnePermission(this.userId, [
					'manage-outgoing-integrations',
					'manage-own-outgoing-integrations',
					'manage-incoming-integrations',
					'manage-own-incoming-integrations',
				])
			) {
				return API.v1.unauthorized();
			}

			const { offset, count } = this.getPaginationItems();
			const { sort, fields: projection, query } = this.parseJsonQuery();

			const ourQuery = Object.assign(mountIntegrationQueryBasedOnPermissions(this.userId), query);
			const cursor = Integrations.find(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				projection,
			});

			const total = Promise.await(cursor.count());

			const integrations = Promise.await(cursor.toArray());

			return API.v1.success({
				integrations,
				offset,
				items: integrations.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'integrations.remove',
	{ authRequired: true },
	{
		post() {
			if (
				!hasAtLeastOnePermission(this.userId, [
					'manage-outgoing-integrations',
					'manage-own-outgoing-integrations',
					'manage-incoming-integrations',
					'manage-own-incoming-integrations',
				])
			) {
				return API.v1.unauthorized();
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					type: String,
					target_url: Match.Maybe(String),
					integrationId: Match.Maybe(String),
				}),
			);

			if (!this.bodyParams.target_url && !this.bodyParams.integrationId) {
				return API.v1.failure('An integrationId or target_url needs to be provided.');
			}

			let integration;
			switch (this.bodyParams.type) {
				case 'webhook-outgoing':
					if (this.bodyParams.target_url) {
						integration = Promise.await(Integrations.findOne({ urls: this.bodyParams.target_url }));
					} else if (this.bodyParams.integrationId) {
						integration = Promise.await(Integrations.findOne({ _id: this.bodyParams.integrationId }));
					}

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					Meteor.runAsUser(this.userId, () => {
						Meteor.call('deleteOutgoingIntegration', integration._id);
					});

					return API.v1.success({
						integration,
					});
				case 'webhook-incoming':
					integration = Promise.await(Integrations.findOne({ _id: this.bodyParams.integrationId }));

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					Meteor.runAsUser(this.userId, () => {
						Meteor.call('deleteIncomingIntegration', integration._id);
					});

					return API.v1.success({
						integration,
					});
				default:
					return API.v1.failure('Invalid integration type.');
			}
		},
	},
);

API.v1.addRoute(
	'integrations.get',
	{ authRequired: true },
	{
		get() {
			const { integrationId, createdBy } = this.queryParams;
			if (!integrationId) {
				return API.v1.failure('The query parameter "integrationId" is required.');
			}

			return API.v1.success({
				integration: Promise.await(
					findOneIntegration({
						userId: this.userId,
						integrationId,
						createdBy,
					}),
				),
			});
		},
	},
);

API.v1.addRoute(
	'integrations.update',
	{ authRequired: true },
	{
		put() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					type: String,
					name: String,
					enabled: Boolean,
					username: String,
					urls: Match.Maybe([String]),
					channel: String,
					event: Match.Maybe(String),
					triggerWords: Match.Maybe([String]),
					alias: Match.Maybe(String),
					avatar: Match.Maybe(String),
					emoji: Match.Maybe(String),
					token: Match.Maybe(String),
					scriptEnabled: Boolean,
					script: Match.Maybe(String),
					targetChannel: Match.Maybe(String),
					integrationId: Match.Maybe(String),
					target_url: Match.Maybe(String),
				}),
			);

			let integration;
			switch (this.bodyParams.type) {
				case 'webhook-outgoing':
					if (this.bodyParams.target_url) {
						integration = Promise.await(Integrations.findOne({ urls: this.bodyParams.target_url }));
					} else if (this.bodyParams.integrationId) {
						integration = Promise.await(Integrations.findOne({ _id: this.bodyParams.integrationId }));
					}

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					Meteor.call('updateOutgoingIntegration', integration._id, this.bodyParams);

					return API.v1.success({
						integration: Promise.await(Integrations.findOne({ _id: integration._id })),
					});
				case 'webhook-incoming':
					integration = Promise.await(Integrations.findOne({ _id: this.bodyParams.integrationId }));

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					Meteor.call('updateIncomingIntegration', integration._id, this.bodyParams);

					return API.v1.success({
						integration: Promise.await(Integrations.findOne({ _id: integration._id })),
					});
				default:
					return API.v1.failure('Invalid integration type.');
			}
		},
	},
);
