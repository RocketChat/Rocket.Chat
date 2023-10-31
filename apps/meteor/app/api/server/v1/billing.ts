import { getCheckoutUrl } from '../../../cloud/server/functions/getCheckoutUrl';
import { API } from '../api';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/billing.checkoutUrl': {
			GET: () => { url: string };
		};
	}
}

API.v1.addRoute(
	'billing.checkoutUrl',
	{ authRequired: true, permissionsRequired: ['manage-cloud'] },
	{
		async get() {
			const checkoutUrl = await getCheckoutUrl();

			if (!checkoutUrl.url) {
				return API.v1.failure();
			}

			return API.v1.success({ url: checkoutUrl.url });
		},
	},
);
