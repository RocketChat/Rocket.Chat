import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';
import {
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import type { FilterOperators } from 'mongodb';

import { API } from '../../../../../app/api/server';
import {
	GETOutboundProvidersResponseSchema,
	GETOutboundProviderParamsSchema,
	GETOutboundProviderBadRequestErrorSchema,
	GETOutboundProviderMetadataSchema,
	POSTOutboundMessageParams,
	POSTOutboundMessageSuccessSchema,
} from '../outboundcomms/rest';
import { outboundMessageProvider } from './lib/outbound';
import type { ExtractRoutesFromAPI } from '../../../../../app/api/server/ApiClass';
import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { restrictDepartmentsQuery } from '../lib/restrictQuery';

const outboundCommsEndpoints = API.v1
	.get(
		'omnichannel/outbound/providers',
		{
			response: {
				200: GETOutboundProvidersResponseSchema,
				400: GETOutboundProviderBadRequestErrorSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			query: GETOutboundProviderParamsSchema,
			permissionsRequired: ['outbound.send-messages'],
			authRequired: true,
			license: ['outbound-messaging'],
		},
		async function action() {
			const { type } = this.queryParams;

			const providers = outboundMessageProvider.listOutboundProviders(type);
			return API.v1.success({
				providers,
			});
		},
	)
	.get(
		'omnichannel/outbound/providers/:id/metadata',
		{
			response: {
				200: GETOutboundProviderMetadataSchema,
				400: GETOutboundProviderBadRequestErrorSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			permissionsRequired: ['outbound.send-messages'],
			authRequired: true,
			license: ['outbound-messaging'],
		},
		async function action() {
			const { id } = this.urlParams;

			const providerMetadata = await outboundMessageProvider.getProviderMetadata(id);
			return API.v1.success({
				metadata: providerMetadata,
			});
		},
	)
	.post(
		'omnichannel/outbound/providers/:id/message',
		{
			response: {
				200: POSTOutboundMessageSuccessSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['outbound.send-messages'],
			body: POSTOutboundMessageParams,
			license: ['outbound-messaging'],
		},
		async function action() {
			const { id } = this.urlParams;
			const { departmentId, agentId } = this.bodyParams;

			// Case 1: Check department and check if agent is in department
			if (departmentId) {
				let query: FilterOperators<ILivechatDepartment> = { _id: departmentId };
				if (!(await hasPermissionAsync(this.userId, 'outbound.can-assign-queues'))) {
					query = await restrictDepartmentsQuery({ originalQuery: query, userId: this.userId });
				}

				const department = await LivechatDepartment.findOne<Pick<ILivechatDepartment, '_id' | 'enabled'>>(query, { _id: 1, enabled: 1 });
				if (!department?.enabled) {
					return API.v1.failure('error-invalid-department');
				}

				// Case 2: Agent & department: if agent is present, agent must be in department
				if (agentId) {
					if (!(await hasPermissionAsync(this.userId, 'outbound.can-assign-any-agent'))) {
						if (await hasPermissionAsync(this.userId, 'outbound.can-assign-self-only') && agentId !== this.userId) {
							return API.v1.forbidden('error-invalid-agent');
						}
					}

					// On here, we take a shortcut: if the user is here, we assume it's an agent (and we assume the collection is kept up to date :) )
					const agent = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(this.bodyParams.agentId!, departmentId);
					if (!agent) {
						return API.v1.failure('error-agent-not-in-department');
					}
				}
				// Case 3: Agent & no department: if agent is present and there's no department, agent must be an agent
			} else if (agentId) {
				if (!(await hasPermissionAsync(this.userId, 'outbound.can-assign-any-agent'))) {
						if (await hasPermissionAsync(this.userId, 'outbound.can-assign-self-only') && agentId !== this.userId) {
							return API.v1.forbidden('error-invalid-agent');
						}
					}

				const agent = await Users.findOneAgentById(this.bodyParams.agentId!, { projection: { _id: 1 } });
				if (!agent) {
					return API.v1.failure('error-agent-not-in-department');
				}
			}

			await outboundMessageProvider.sendMessage(id, this.bodyParams);
			return API.v1.success();
		},
	);

export type OutboundCommsEndpoints = ExtractRoutesFromAPI<typeof outboundCommsEndpoints>;
