import type { IIntegration, INewIncomingIntegration, INewOutgoingIntegration, IIntegrationHistory } from '@rocket.chat/core-typings';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import {
	ajv,
	isIntegrationsCreateProps,
	isIntegrationsRemoveProps,
	isIntegrationsGetProps,
	isIntegrationsUpdateProps,
	isIntegrationsListProps,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Match, check } from 'meteor/check';
import type { Filter } from 'mongodb';

import {
	mountIntegrationHistoryQueryBasedOnPermissions,
	mountIntegrationQueryBasedOnPermissions,
} from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { addIncomingIntegration } from '../../../integrations/server/methods/incoming/addIncomingIntegration';
import { deleteIncomingIntegration } from '../../../integrations/server/methods/incoming/deleteIncomingIntegration';
import { updateIncomingIntegration } from '../../../integrations/server/methods/incoming/updateIncomingIntegration';
import { addOutgoingIntegration } from '../../../integrations/server/methods/outgoing/addOutgoingIntegration';
import { deleteOutgoingIntegration } from '../../../integrations/server/methods/outgoing/deleteOutgoingIntegration';
import { updateOutgoingIntegration } from '../../../integrations/server/methods/outgoing/updateOutgoingIntegration';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { findOneIntegration } from '../lib/integrations';

API.v1.addRoute(
	'integrations.create',
	{ authRequired: true, validateParams: isIntegrationsCreateProps },
	{
		async post() {
			switch (this.bodyParams.type) {
				case 'webhook-outgoing':
					return API.v1.success({ integration: await addOutgoingIntegration(this.userId, this.bodyParams as INewOutgoingIntegration) });
				case 'webhook-incoming':
					return API.v1.success({ integration: await addIncomingIntegration(this.userId, this.bodyParams as INewIncomingIntegration) });
			}

			return API.v1.failure('Invalid integration type.');
		},
	},
);

type IntegrationsHistoryProps = PaginatedRequest<{ id: string }>;

const integrationsHistorySchema = {
	type: 'object',
	properties: {
		id: { type: 'string', nullable: false, minLength: 1 },
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
	},
	required: ['id'],
	additionalProperties: false,
};

const isIntegrationsHistoryProps = ajv.compile<IntegrationsHistoryProps>(integrationsHistorySchema);

const integrationsHistoryEndpoints = API.v1.get(
	'integrations.history',
	{
		authRequired: true,
		validateParams: isIntegrationsHistoryProps,
		query: isIntegrationsHistoryProps,
		permissionsRequired: {
			GET: { permissions: ['manage-outgoing-integrations', 'manage-own-outgoing-integrations'], operation: 'hasAny' },
		},
		response: {
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			200: ajv.compile<PaginatedResult<{ history: IIntegrationHistory[]; items: number }>>({
				type: 'object',
				properties: {
					history: { type: 'array' },
					offset: { type: 'string' },
					items: { type: 'integer' },
					count: { type: 'integer' },
					total: { type: 'integer' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['success'],
				additionalProperties: false,
			}),
		},
	},

	async function action() {
		const { userId, queryParams } = this;

		if (!queryParams.id || queryParams.id.trim() === '') {
			return API.v1.failure('Invalid integration id.');
		}

		const { id } = queryParams;
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields: projection, query } = await this.parseJsonQuery();
		const ourQuery = Object.assign(await mountIntegrationHistoryQueryBasedOnPermissions(userId, id), query);

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
);

API.v1.addRoute(
	'integrations.list',
	{
		authRequired: true,
		validateParams: isIntegrationsListProps,
		permissionsRequired: {
			GET: {
				permissions: [
					'manage-outgoing-integrations',
					'manage-own-outgoing-integrations',
					'manage-incoming-integrations',
					'manage-own-incoming-integrations',
				],
				operation: 'hasAny',
			},
		},
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();
			const { name, type } = this.queryParams;

			const filter = {
				...query,
				...(name ? { name: { $regex: escapeRegExp(name as string), $options: 'i' } } : {}),
				...(type ? { type } : {}),
			};

			const ourQuery = Object.assign(await mountIntegrationQueryBasedOnPermissions(this.userId), filter) as Filter<IIntegration>;

			const { cursor, totalCount } = Integrations.findPaginated(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				projection: fields,
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
	{
		authRequired: true,
		validateParams: isIntegrationsRemoveProps,
		permissionsRequired: {
			POST: {
				permissions: [
					'manage-outgoing-integrations',
					'manage-own-outgoing-integrations',
					'manage-incoming-integrations',
					'manage-own-incoming-integrations',
				],
				operation: 'hasAny',
			},
		},
	},
	{
		async post() {
			const { bodyParams } = this;

			let integration: IIntegration | null = null;
			switch (bodyParams.type) {
				case 'webhook-outgoing':
					if (!bodyParams.target_url && !bodyParams.integrationId) {
						return API.v1.failure('An integrationId or target_url needs to be provided.');
					}

					if (bodyParams.target_url) {
						integration = await Integrations.findOne({ urls: bodyParams.target_url });
					} else if (bodyParams.integrationId) {
						integration = await Integrations.findOne({ _id: bodyParams.integrationId });
					}

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					const outgoingId = integration._id;

					await deleteOutgoingIntegration(outgoingId, this.userId);

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

					integration = await Integrations.findOne({ _id: bodyParams.integrationId });

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					const incomingId = integration._id;
					await deleteIncomingIntegration(incomingId, this.userId);

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
		async get() {
			const { integrationId, createdBy } = this.queryParams;
			if (!integrationId) {
				return API.v1.failure('The query parameter "integrationId" is required.');
			}

			return API.v1.success({
				integration: await findOneIntegration({
					userId: this.userId,
					integrationId,
					createdBy,
				}),
			});
		},
	},
);

API.v1.addRoute(
	'integrations.update',
	{ authRequired: true, validateParams: isIntegrationsUpdateProps },
	{
		async put() {
			const { bodyParams } = this;

			let integration;
			switch (bodyParams.type) {
				case 'webhook-outgoing':
					if (bodyParams.target_url) {
						integration = await Integrations.findOne({ urls: bodyParams.target_url });
					} else if (bodyParams.integrationId) {
						integration = await Integrations.findOne({ _id: bodyParams.integrationId });
					}

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					await updateOutgoingIntegration(this.userId, integration._id, bodyParams);

					return API.v1.success({
						integration: await Integrations.findOne({ _id: integration._id }),
					});
				case 'webhook-incoming':
					integration = await Integrations.findOne({ _id: bodyParams.integrationId });

					if (!integration) {
						return API.v1.failure('No integration found.');
					}

					await updateIncomingIntegration(this.userId, integration._id, bodyParams);

					return API.v1.success({
						integration: await Integrations.findOne({ _id: integration._id }),
					});
				default:
					return API.v1.failure('Invalid integration type.');
			}
		},
	},
);

type IntegrationsHistoryEndpoints = ExtractRoutesFromAPI<typeof integrationsHistoryEndpoints>;

export type IntegrationsEndpoints = IntegrationsHistoryEndpoints;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends IntegrationsHistoryEndpoints {}
}
