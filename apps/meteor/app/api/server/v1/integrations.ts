import type {
	IIntegration,
	INewIncomingIntegration,
	INewOutgoingIntegration,
	IIncomingIntegration,
	IOutgoingIntegration,
} from '@rocket.chat/core-typings';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	isIntegrationsCreateProps,
	isIntegrationsHistoryProps,
	isIntegrationsRemoveProps,
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

type IntegrationsGetProps = { integrationId: string; createdBy?: string };

const integrationsGetSchema = {
	type: 'object',
	properties: {
		integrationId: {
			type: 'string',
			nullable: false,
		},
		createdBy: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['integrationId'],
};

const isIntegrationsGetProps = ajv.compile<IntegrationsGetProps>(integrationsGetSchema);

const integrationsEndpoints = API.v1.get(
	'integrations.get',
	{
		authRequired: true,
		query: isIntegrationsGetProps,
		response: {
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			200: ajv.compile<{ integration: IIncomingIntegration | IOutgoingIntegration }>({
				type: 'object',
				properties: {
					integration: {
						anyOf: [{ $ref: '#/components/schemas/IIncomingIntegration' }, { $ref: '#/components/schemas/IOutgoingIntegration' }],
					},
					success: { type: 'boolean', enum: [true] },
				},
				required: ['integration', 'success'],
			}),
		},
	},

	async function action() {
		const { integrationId, createdBy } = this.queryParams;
		if (!integrationId) {
			return API.v1.failure('The query parameter "integrationId" is required.');
		}

		const integration = await findOneIntegration({
			userId: this.userId,
			integrationId,
			createdBy,
		});

		// TODO : remove this line if the database doesnt return null value for script. since script should never be null
		if (!integration.script) integration.script = '';

		return API.v1.success({ integration });
	},
);

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
				default:
					return API.v1.failure('Invalid integration type.');
			}
		},
	},
);

API.v1.addRoute(
	'integrations.history',
	{
		authRequired: true,
		validateParams: isIntegrationsHistoryProps,
		permissionsRequired: {
			GET: { permissions: ['manage-outgoing-integrations', 'manage-own-outgoing-integrations'], operation: 'hasAny' },
		},
	},
	{
		async get() {
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

export type IntegrationsEndpoints = ExtractRoutesFromAPI<typeof integrationsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends IntegrationsEndpoints {}
}
