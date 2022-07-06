import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { IIntegration } from '@rocket.chat/core-typings';
import {
	isIntegrationsCreateProps,
	isIntegrationsHistoryProps,
	isIntegrationsRemoveProps,
	isIntegrationsGetProps,
	isIntegrationsUpdateProps,
} from '@rocket.chat/rest-typings';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import type { Filter } from 'mongodb';

import { hasAtLeastOnePermission } from '../../../authorization/server';
import { API } from '../api';
import {
	mountIntegrationHistoryQueryBasedOnPermissions,
	mountIntegrationQueryBasedOnPermissions,
} from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { findOneIntegration } from '../lib/integrations';

API.v1.addRoute(
	'integrations.create',
	{ authRequired: true, validateParams: isIntegrationsCreateProps },
	{
		async post() {
			switch (this.bodyParams.type) {
				case 'webhook-outgoing':
					return API.v1.success({ integration: await Meteor.call('addOutgoingIntegration', this.bodyParams) });
				case 'webhook-incoming':
					return API.v1.success({ integration: await Meteor.call('addIncomingIntegration', this.bodyParams) });
			}

			return API.v1.failure('Invalid integration type.');
		},
	},
);

API.v1.addRoute(
	'integrations.history',
	{ authRequired: true, validateParams: isIntegrationsHistoryProps },
	{
		async get() {
			const { userId, queryParams } = this;

			if (!hasAtLeastOnePermission(userId, ['manage-outgoing-integrations', 'manage-own-outgoing-integrations'])) {
				return API.v1.unauthorized();
			}

			if (!queryParams.id || queryParams.id.trim() === '') {
				return API.v1.failure('Invalid integration id.');
			}

			const { id } = queryParams;
			const { offset, count } = this.getPaginationItems();
			const { sort, fields: projection, query } = this.parseJsonQuery();
			const ourQuery = Object.assign(mountIntegrationHistoryQueryBasedOnPermissions(userId, id), query);

			const { cursor, totalCount } = IntegrationHistory.findPaginated(ourQuery, {
				sort: sort || { _updatedAt: -1 },
				skip: offset,
				limit: count,
				projection,
			});

			const [history, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				history,
				offset,
				items: history.length,
				count: history.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'integrations.list',
	{ authRequired: true },
	{
		async get() {
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

			const ourQuery = Object.assign(mountIntegrationQueryBasedOnPermissions(this.userId), query) as Filter<IIntegration>;

			const { cursor, totalCount } = Integrations.findPaginated(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				projection,
			});

			const [integrations, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				integrations,
				offset,
				items: integrations.length,
				count: integrations.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'integrations.remove',
	{ authRequired: true, validateParams: isIntegrationsRemoveProps },
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

			const { bodyParams } = this;

			let integration: IIntegration | null = null;
			switch (bodyParams.type) {
				case 'webhook-outgoing':
					if (!bodyParams.target_url && !bodyParams.integrationId) {
						return API.v1.failure('An integrationId or target_url needs to be provided.');
					}

					if (bodyParams.target_url) {
						integration = Promise.await(Integrations.findOne({ urls: bodyParams.target_url }));
					} else if (bodyParams.integrationId) {
						integration = Promise.await(Integrations.findOne({ _id: bodyParams.integrationId }));
					}

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					const outgoingId = integration._id;

					Meteor.runAsUser(this.userId, () => {
						Meteor.call('deleteOutgoingIntegration', outgoingId);
					});

					return API.v1.success({
						integration,
					});
				case 'webhook-incoming':
					check(
						bodyParams,
						Match.ObjectIncluding({
							integrationId: String,
						}),
					);

					integration = Promise.await(Integrations.findOne({ _id: bodyParams.integrationId }));

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					const incomingId = integration._id;
					Meteor.runAsUser(this.userId, () => {
						Meteor.call('deleteIncomingIntegration', incomingId);
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
	{ authRequired: true, validateParams: isIntegrationsGetProps },
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
	{ authRequired: true, validateParams: isIntegrationsUpdateProps },
	{
		put() {
			const { bodyParams } = this;

			let integration;
			switch (bodyParams.type) {
				case 'webhook-outgoing':
					if (bodyParams.target_url) {
						integration = Promise.await(Integrations.findOne({ urls: bodyParams.target_url }));
					} else if (bodyParams.integrationId) {
						integration = Promise.await(Integrations.findOne({ _id: bodyParams.integrationId }));
					}

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					Meteor.call('updateOutgoingIntegration', integration._id, bodyParams);

					return API.v1.success({
						integration: Promise.await(Integrations.findOne({ _id: integration._id })),
					});
				case 'webhook-incoming':
					integration = Promise.await(Integrations.findOne({ _id: bodyParams.integrationId }));

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					Meteor.call('updateIncomingIntegration', integration._id, bodyParams);

					return API.v1.success({
						integration: Promise.await(Integrations.findOne({ _id: integration._id })),
					});
				default:
					return API.v1.failure('Invalid integration type.');
			}
		},
	},
);
