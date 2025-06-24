import { API } from '../../../../../app/api/server';
import { isGETOutboundProviderParams } from '../outboundcomms/rest';

API.v1.addRoute(
	'omnichannel/outbound/providers',
	{ authRequired: true, validateParams: isGETOutboundProviderParams },
	{
		async get() {
			return API.v1.success({
				providers: [],
			});
		},
	},
);

API.v1.addRoute(
	'omnichannel/outbound/providers/:id/metadata',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success({
				providerMetadata: [],
			});
		},
	},
);

API.v1.addRoute(
	'omnichannel/outbound/message',
	{ authRequired: true },
	{
		async post() {
			return API.v1.success();
		},
	},
);
