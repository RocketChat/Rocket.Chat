import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';
import { validateForbiddenErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import {
	GETOutboundProvidersResponseSchema,
	GETOutboundProviderParamsSchema,
	GETOutboundProviderBadRequestErrorSchema,
	GETOutboundProviderMetadataSchema,
	POSTOutboundMessageParams,
	POSTOutboundMessageErrorSchema,
	POSTOutboundMessageSuccessSchema,
} from '../outboundcomms/rest';
import { outboundMessageProvider } from './lib/outbound';
import type { ExtractRoutesFromAPI } from '../../../../../app/api/server/ApiClass';
import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';

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
				400: POSTOutboundMessageErrorSchema,
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
				if (!(await hasPermissionAsync(this.userId, 'outbound.can-assign-queues'))) {
					return API.v1.forbidden();
				}

				const department = await LivechatDepartment.findOneById(departmentId, { _id: 1 });
				if (!department?.enabled) {
					throw new Error('error-invalid-department');
				}

				// Case 2: Agent & department: if agent is present, agent must be in department
				if (agentId) {
					if (agentId !== this.userId && !(await hasPermissionAsync(this.userId, 'outbound.can-assign-any-agent'))) {
						if (await hasPermissionAsync(this.userId, 'outbound.can-assign-self-only')) {
							// Override agentId when user has permission to assign self only
							this.bodyParams.agentId = this.userId;
						} else {
							return API.v1.forbidden();
						}
					}

					// On here, we take a shortcut: if the user is here, we assume it's an agent (and we assume the collection is kept up to date :) )
					const agent = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(this.bodyParams.agentId!, departmentId);
					if (!agent) {
						throw new Error('error-agent-not-in-department');
					}
				}
				// Case 3: Agent & no department: if agent is present and there's no department, agent must be an agent
			} else if (agentId) {
				if (agentId !== this.userId && !(await hasPermissionAsync(this.userId, 'outbound.can-assign-any-agent'))) {
					if (await hasPermissionAsync(this.userId, 'outbound.can-assign-self-only')) {
						this.bodyParams.agentId = this.userId;
					} else {
						return API.v1.forbidden();
					}
				}

				const agent = await Users.findOneAgentById(this.bodyParams.agentId!, { projection: { _id: 1 } });
				if (!agent) {
					throw new Error('error-agent-not-in-department');
				}
			}

			await outboundMessageProvider.sendMessage(id, this.bodyParams);
			return API.v1.success();
		},
	);

export type OutboundCommsEndpoints = ExtractRoutesFromAPI<typeof outboundCommsEndpoints>;
