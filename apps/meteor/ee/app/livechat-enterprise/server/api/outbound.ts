import { API } from '../../../../../app/api/server';
import {
	GETOutboundProvidersResponseSchema,
	isGETOutboundProviderParams,
	IsOutboundProviderBadRequestErrorSchema,
	isOutboundProviderMetadataSchema,
} from '../outboundcomms/rest';
import { outboundMessageProvider } from './lib/outbound';
import type { ExtractRoutesFromAPI } from '../../../../../app/api/server/ApiClass';

const outboundCommsEndpoints = API.v1
	.get(
		'omnichannel/outbound/providers',
		{
			response: {
				200: GETOutboundProvidersResponseSchema,
				400: IsOutboundProviderBadRequestErrorSchema,
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
	)
	.get(
		'omnichannel/outbound/providers/:id/metadata',
		{
			response: {
				200: isOutboundProviderMetadataSchema,
				400: IsOutboundProviderBadRequestErrorSchema,
			},
			authRequired: true,
		},
		async function action() {
			const { id } = this.urlParams;

			const providerMetadata = await outboundMessageProvider.getProviderMetadata(id);
			return API.v1.success({
				metadata: providerMetadata,
			});
		},
	);

export type OutboundCommsEndpoints = ExtractRoutesFromAPI<typeof outboundCommsEndpoints>;
