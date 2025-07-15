import type { IOutboundProvider, IOutboundProviderMetadata } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { API } from '../../../../../app/api/server';
import { isGETOutboundProviderParams } from '../outboundcomms/rest';
import { outboundMessageProvider } from './lib/outbound';
import type { ExtractRoutesFromAPI } from '../../../../../app/api/server/ApiClass';

const outboundCommsEndpoints = [
	API.v1.get(
		'omnichannel/outbound/providers',
		{
			response: {
				200: ajv.compile<{ providers: IOutboundProvider[] }>({
					type: 'object',
					properties: {
						providers: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									providerId: {
										type: 'string',
									},
									providerName: {
										type: 'string',
									},
									supportsTemplates: {
										type: 'boolean',
									},
									providerType: {
										type: 'string',
									},
								},
							},
						},
					},
				}),
			},
			query: isGETOutboundProviderParams,
			authRequired: true,
		},
		async function action() {
			const { type } = this.queryParams;

			const providers = outboundMessageProvider.listOutboundProviders(type);
			return API.v1.success({
				providers,
			});
		},
	),
	API.v1.get(
		'omnichannel/outbound/providers/:id/metadata',
		{
			response: {
				200: ajv.compile<{ metadata: IOutboundProviderMetadata }>({
					type: 'object',
					properties: {
						metadata: {
							type: 'object',
							properties: {
								providerId: {
									type: 'string',
								},
								providerName: {
									type: 'string',
								},
								supportsTemplates: {
									type: 'boolean',
								},
								providerType: {
									type: 'string',
								},
								templates: {
									type: 'object',
								},
							},
						},
					},
				}),
			},
			authRequired: true,
		},
		async function action() {
			const { id } = this.urlParams;

			const providerMetadata = outboundMessageProvider.getProviderMetadata(id);
			return API.v1.success({
				metadata: providerMetadata,
			});
		},
	),
];

export type OutboundCommsEndpoints = ExtractRoutesFromAPI<typeof outboundCommsEndpoints>;
