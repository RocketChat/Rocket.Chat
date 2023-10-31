import { getCheckoutUrl } from '../../../cloud/server/functions/getCheckoutUrl';
import { API } from '../api';

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
