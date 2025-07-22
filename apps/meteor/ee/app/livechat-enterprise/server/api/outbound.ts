import type { IOutboundProvider } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { isGETOutboundProviderParams } from '../outboundcomms/rest';
import { outboundMessageProvider } from './lib/outbound';
import type { ExtractRoutesFromAPI } from '../../../../../app/api/server/ApiClass';

const outboundCommsEndpoints = API.v1.get(
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
								documentationUrl: {
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
);

export type OutboundCommsEndpoints = ExtractRoutesFromAPI<typeof outboundCommsEndpoints>;
