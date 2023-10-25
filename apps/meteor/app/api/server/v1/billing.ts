import { getCheckoutUrl } from '../../../cloud/server/functions/getCheckoutUrl';
import { getWorkspaceAccessTokenWithScope } from '../../../cloud/server/functions/getWorkspaceAccessTokenWithScope';
import { getURL } from '../../../utils/server/getURL';
import { API } from '../api';

API.v1.addRoute(
	'billing.checkoutUrl',
	{ authRequired: true, permissionsRequired: ['manage-cloud'] },
	{
		async get() {
			const { token } = await getWorkspaceAccessTokenWithScope('workspace:billing');
			if (!token) {
				return API.v1.unauthorized();
			}

			const subscriptionURL =
				process.env.NODE_ENV !== 'production' ? 'http://localhost:3000/admin/subscription/' : getURL('admin/subscription');

			const bodyParams = {
				okCallback: `${subscriptionURL}?subscriptionSuccess=true`,
				cancelCallback: subscriptionURL,
			};

			const checkoutUrl = await getCheckoutUrl(token, bodyParams);

			if (!checkoutUrl.url) {
				return API.v1.failure(checkoutUrl);
			}

			return API.v1.success({ url: checkoutUrl.url });
		},
	},
);
