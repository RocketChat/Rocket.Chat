import type { IIntegration, IIntegrationHistory, INewIncomingIntegration, INewOutgoingIntegration } from '@rocket.chat/core-typings';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import {
	ajv,
	isIntegrationsCreateProps,
	isIntegrationsHistoryProps,
	isIntegrationsRemoveProps,
	isIntegrationsGetProps,
	isIntegrationsUpdateProps,
	isIntegrationsListProps,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
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
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { findOneIntegration } from '../lib/integrations';

const integrationSuccessSchema = ajv.compile<{ integration: IIntegration | null }>({
	type: 'object',
	properties: {
		integration: { type: 'object' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['integration', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'integrations.create',
	{
		authRequired: true,
		body: isIntegrationsCreateProps,
		response: {
			200: integrationSuccessSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		switch (this.bodyParams.type) {
			case 'webhook-outgoing':
				return API.v1.success({
					integration: await addOutgoingIntegration(this.userId, this.bodyParams as INewOutgoingIntegration),
				});
			case 'webhook-incoming':
				return API.v1.success({
					integration: await addIncomingIntegration(this.userId, this.bodyParams as INewIncomingIntegration),
				});
			default:
				return API.v1.failure('Invalid integration type.');
		}
	},
);

API.v1.get(
	'integrations.history',
	{
		authRequired: true,
		query: isIntegrationsHistoryProps,
		permissionsRequired: {
			GET: { permissions: ['manage-outgoing-integrations', 'manage-own-outgoing-integrations'], operation: 'hasAny' },
		},
		response: {
			200: ajv.compile<{ history: IIntegrationHistory[]; offset: number; items: number; count: number; total: number }>({
				type: 'object',
				properties: {
					history: { type: 'array', items: { type: 'object' } },
					offset: { type: 'number' },
					items: { type: 'number' },
					count: { type: 'number' },
					total: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['history', 'offset', 'items', 'count', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
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

API.v1.get(
	'integrations.list',
	{
		authRequired: true,
		query: isIntegrationsListProps,
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
		response: {
			200: ajv.compile<{ integrations: IIntegration[]; offset: number; items: number; count: number; total: number }>({
				type: 'object',
				properties: {
					integrations: {
						type: 'array',
						items: { type: 'object' },
					},
					offset: { type: 'number' },
					items: { type: 'number' },
					count: { type: 'number' },
					total: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['integrations', 'offset', 'items', 'count', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();
		const { name, type } = this.queryParams;

		const filter = {
			...query,
			...(name ? { name: { $regex: escapeRegExp(name), $options: 'i' } } : {}),
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
);

API.v1.post(
	'integrations.remove',
	{
		authRequired: true,
		body: isIntegrationsRemoveProps,
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
		response: {
			200: integrationSuccessSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.get(
	'integrations.get',
	{
		authRequired: true,
		query: isIntegrationsGetProps,
		response: {
			200: ajv.compile<{ integration: IIntegration | null }>({
				type: 'object',
				properties: {
					integration: { type: 'object' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['integration', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
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
);

API.v1.put(
	'integrations.update',
	{
		authRequired: true,
		body: isIntegrationsUpdateProps,
		response: {
			200: integrationSuccessSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { bodyParams } = this;

		let integration: IIntegration | null = null;
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

				await updateOutgoingIntegration(this.userId, integration._id, bodyParams as Parameters<typeof updateOutgoingIntegration>[2]);

				return API.v1.success({
					integration: await Integrations.findOne({ _id: integration._id }),
				});
			case 'webhook-incoming':
				integration = await Integrations.findOne({ _id: bodyParams.integrationId });

				if (!integration) {
					return API.v1.failure('No integration found.');
				}

				await updateIncomingIntegration(
					this.userId,
					integration._id,
					bodyParams as unknown as Parameters<typeof updateIncomingIntegration>[2],
				);

				return API.v1.success({
					integration: await Integrations.findOne({ _id: integration._id }),
				});
			default:
				return API.v1.failure('Invalid integration type.');
		}
	},
);
