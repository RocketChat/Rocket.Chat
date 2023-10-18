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

			const manageSubscriptionURL =
				process.env.NODE_ENV !== 'production' ? 'http://localhost:3000/admin/manage-subscription/' : getURL('admin/manage-subscription');

			const bodyParams = {
				okCallback: `${manageSubscriptionURL}?subscriptionSuccess=true`,
				cancelCallback: manageSubscriptionURL,
			};

			const checkoutUrl = await getCheckoutUrl(token, bodyParams);

			if (!checkoutUrl.url) {
				return API.v1.failure(checkoutUrl);
			}

			return API.v1.success({ url: checkoutUrl.url });
		},
	},
);
