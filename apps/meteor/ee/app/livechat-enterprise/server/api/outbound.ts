import { API } from '../../../../../app/api/server';
import { isGETOutboundProviderParams } from '../outboundcomms/rest';
import { outboundMessageProvider } from './lib/outbound';

API.v1.addRoute(
	'omnichannel/outbound/providers',
	{ authRequired: true, validateParams: isGETOutboundProviderParams },
	{
		async get() {
			const { type } = this.queryParams;

			const providers = outboundMessageProvider.listOutboundProviders(type);
			return API.v1.success({
				providers,
			});
		},
	},
);

API.v1.addRoute(
	'omnichannel/outbound/providers/:id/metadata',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success();
		},
	},
);
