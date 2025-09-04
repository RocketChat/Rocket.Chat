import { canSendOutboundMessage } from '@rocket.chat/omni-core-ee';
import {
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

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

			await canSendOutboundMessage(this.userId, agentId, departmentId);

			await outboundMessageProvider.sendMessage(id, this.bodyParams);
			return API.v1.success();
		},
	);

export type OutboundCommsEndpoints = ExtractRoutesFromAPI<typeof outboundCommsEndpoints>;
