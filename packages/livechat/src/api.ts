import { LivechatClientImpl } from '@rocket.chat/ddp-client';

import { host, useSsl } from './host';

export { useSsl };

export const Livechat = LivechatClientImpl.create(host?.replace(/^http/, 'ws'));

Livechat.rest.use(async function (request, next) {
	try {
		return await next(...request);
	} catch (error) {
		if (error instanceof Response) {
			const e = await error.json();
			throw e;
		}

		throw error;
	}
});
