import { API } from '../../../../../app/api/server';
import { isGETOutboundProviderParams } from '../outboundcomms/rest';
import { OutboundMessageProviderService } from './lib/outbound';

const outboundMessageProvider = new OutboundMessageProviderService();

API.v1.addRoute(
	'omnichannel/outbound/providers',
	{ authRequired: true, validateParams: isGETOutboundProviderParams },
	{
		async get() {
			const { type } = this.queryParams;

			const providers = outboundMessageProvider.listOutboundProviders(type);

			try {
				return API.v1.success({
					providers,
				});
			} catch (error) {
				return API.v1.failure(error);
			}
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
