import { LivechatClientImpl, FetchError } from '@rocket.chat/ddp-client';
import { parse } from 'query-string';

const host =
	window.SERVER_URL ?? parse(window.location.search).serverUrl ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null);
export const useSsl = Boolean((Array.isArray(host) ? host[0] : host)?.match(/^https:/));

export const Livechat = LivechatClientImpl.create(host.replace(/^http/, 'ws'));

Livechat.rest.use(async function (request, next) {
	try {
		return await next(...request);
	} catch (error) {
		if (error instanceof FetchError) {
			const e = await error.response.json();
			throw e;
		}

		throw error;
	}
});

Livechat.connection.connect();
