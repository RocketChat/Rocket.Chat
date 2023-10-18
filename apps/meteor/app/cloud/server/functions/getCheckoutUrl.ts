import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';

type CheckoutBodyParams = {
	okCallback: string;
	cancelCallback: string;
	meta?: Record<string, string>;
};

export const getCheckoutUrl = async (token: string, body: CheckoutBodyParams) => {
	try {
		const billingUrl = settings.get<string>('Cloud_Billing_Url');

		const response = await fetch(`${billingUrl}/api/v2/checkout`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body,
		});

		if (!response.url) {
			const { i18n } = await response.json();
			throw new Error(i18n);
		}

		return response.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to get Checkout URL with Rocket.Chat Billing Service',
			url: '/api/v2/checkout',
			err,
		});

		throw err;
	}
};
