import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { getURL } from '../../../utils/server/getURL';
import { getWorkspaceAccessTokenOrThrow } from './getWorkspaceAccessToken';
import { syncWorkspace } from './syncWorkspace';

export const fallback = `https://go.rocket.chat/i/contact-sales`;

export const getCheckoutUrl = async (): Promise<{
	url: string;
}> => {
	try {
		await syncWorkspace();

		const token = await getWorkspaceAccessTokenOrThrow(true, 'workspace:billing', false);

		const subscriptionURL = getURL('admin/subscription', {
			full: true,
		});

		const body = {
			okCallback: `${subscriptionURL}?subscriptionSuccess=true`,
			cancelCallback: subscriptionURL,
		};

		const billingUrl = settings.get<string>('Cloud_Billing_Url');

		const response = await fetch(`${billingUrl}/api/v2/checkout`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body,
		});

		if (!response.ok) {
			throw new Error(await response.json());
		}

		return response.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to get Checkout URL with Rocket.Chat Billing Service',
			url: '/api/v2/checkout',
			err,
		});

		return {
			url: fallback,
		};
	}
};
