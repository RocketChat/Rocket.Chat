import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { getCheckoutUrl } from '../../../cloud/server/functions/getCheckoutUrl';
import { getWorkspaceAccessTokenWithScope } from '../../../cloud/server/functions/getWorkspaceAccessTokenWithScope';
import { getURL } from '../../../utils/server/getURL';
import { API } from '../api';

API.v1.addRoute(
	'billing.checkoutUrl',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'manage-cloud'))) {
				return API.v1.unauthorized();
			}

			const { token } = await getWorkspaceAccessTokenWithScope('workspace:billing');
			if (!token) {
				return API.v1.unauthorized();
			}

			const bodyParams = {
				okCallback: `${getURL('admin/manage-subscription/?subscriptionSuccess=true')}`,
				cancelCallback: `${getURL('admin/manage-subscription')}`,
			};

			const checkoutUrl = await getCheckoutUrl(token, bodyParams);

			if (checkoutUrl.error) {
				return API.v1.failure(checkoutUrl.error);
			}

			return API.v1.success({ url: checkoutUrl.url });
		},
	},
);
