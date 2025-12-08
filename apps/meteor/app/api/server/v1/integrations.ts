import type {
	IIntegration,
	INewIncomingIntegration,
	INewOutgoingIntegration,
	OutgoingIntegrationEvent,
	IntegrationScriptEngine,
} from '@rocket.chat/core-typings';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';
import {
	ajv,
	isIntegrationsHistoryProps,
	isIntegrationsRemoveProps,
	isIntegrationsGetProps,
	isIntegrationsUpdateProps,
	isIntegrationsListProps,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
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

export type IntegrationsCreateProps =
	| {
			type: 'webhook-incoming';
			username: string;
			channel: string;
			overrideDestinationChannelEnabled?: boolean;
			scriptEnabled: boolean;
			script?: string;
			name: string;
			enabled: boolean;
			alias?: string;
			avatar?: string;
			emoji?: string;
			scriptEngine?: IntegrationScriptEngine;
	  }
	| {
			type: 'webhook-outgoing';
			username: string;
			channel: string;
			event: OutgoingIntegrationEvent;
			targetRoom?: string;
			urls?: string[];
			triggerWords?: string[];
			triggerWordAnywhere?: boolean;
			token?: string;
			scriptEnabled: boolean;
			script?: string;
			runOnEdits?: boolean;
			retryFailedCalls?: boolean;
			retryCount?: number;
			retryDelay?: string;
			impersonateUser?: boolean;
			name: string;
			enabled: boolean;
			alias?: string;
			avatar?: string;
			emoji?: string;
			scriptEngine?: IntegrationScriptEngine;
	  };

const integrationsCreateSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					pattern: 'webhook-incoming',
					nullable: false,
				},
				username: {
					type: 'string',
					nullable: false,
				},
				channel: {
					type: 'string',
					nullable: false,
				},
				scriptEnabled: {
					type: 'boolean',
					nullable: false,
				},
				overrideDestinationChannelEnabled: {
					type: 'boolean',
					nullable: true,
				},
				script: {
					type: 'string',
					nullable: true,
				},
				name: {
					type: 'string',
					nullable: false,
				},
				enabled: {
					type: 'boolean',
					nullable: false,
				},
				alias: {
					type: 'string',
					nullable: true,
				},
				avatar: {
					type: 'string',
					nullable: true,
				},
				emoji: {
					type: 'string',
					nullable: true,
				},
				scriptEngine: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['type', 'username', 'channel', 'scriptEnabled', 'name', 'enabled'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					pattern: 'webhook-outgoing',
					nullable: false,
				},
				username: {
					type: 'string',
					nullable: false,
				},
				channel: {
					type: 'string',
					nullable: false,
				},
				event: {
					type: 'string',
					nullable: false,
				},
				targetRoom: {
					type: 'string',
					nullable: true,
				},
				urls: {
					type: 'array',
					items: {
						type: 'string',
						minLength: 1,
					},
					nullable: true,
				},
				triggerWords: {
					type: 'array',
					items: {
						type: 'string',
						minLength: 1,
					},
					nullable: true,
				},
				triggerWordAnywhere: {
					type: 'boolean',
					nullable: true,
				},
				token: {
					type: 'string',
					nullable: true,
				},
				scriptEnabled: {
					type: 'boolean',
					nullable: false,
				},
				script: {
					type: 'string',
					nullable: true,
				},
				runOnEdits: {
					type: 'boolean',
					nullable: true,
				},
				retryFailedCalls: {
					type: 'boolean',
					nullable: true,
				},
				retryCount: {
					type: 'number',
					nullable: true,
				},
				retryDelay: {
					type: 'string',
					nullable: true,
				},
				impersonateUser: {
					type: 'boolean',
					nullable: true,
				},
				name: {
					type: 'string',
					nullable: false,
				},
				enabled: {
					type: 'boolean',
					nullable: false,
				},
				alias: {
					type: 'string',
					nullable: true,
				},
				avatar: {
					type: 'string',
					nullable: true,
				},
				emoji: {
					type: 'string',
					nullable: true,
				},
				scriptEngine: {
					type: 'string',
					nullable: true,
				},
			},
			required: ['type', 'username', 'channel', 'event', 'scriptEnabled', 'name', 'enabled'],
			additionalProperties: false,
		},
	],
};

const isIntegrationsCreateProps = ajv.compile<IntegrationsCreateProps>(integrationsCreateSchema);

const integrationsEndpoints = API.v1.post(
	'integrations.create',
	{
		authRequired: true,
		body: isIntegrationsCreateProps,
		response: {
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			200: ajv.compile<{ integration: IIntegration }>({
				type: 'object',
				properties: {
					integration: { $ref: '#/components/schemas/IIntegration' },
					success: {
						type: 'boolean',
					},
				},
				required: ['integration', 'success'],
			}),
		},
	},
	async function action() {
		switch (this.bodyParams.type) {
			case 'webhook-outgoing':
				return API.v1.success({ integration: await addOutgoingIntegration(this.userId, this.bodyParams as INewOutgoingIntegration) });
			case 'webhook-incoming':
				return API.v1.success({ integration: await addIncomingIntegration(this.userId, this.bodyParams as INewIncomingIntegration) });
		}

		return API.v1.failure('Invalid integration type.');
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

export type IntegrationsEndpoints = ExtractRoutesFromAPI<typeof integrationsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends IntegrationsEndpoints {}
}
