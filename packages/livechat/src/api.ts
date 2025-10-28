import { LivechatClientImpl } from '@rocket.chat/ddp-client';
import { parse } from 'query-string';

const host =
	window.SERVER_URL ?? parse(window.location.search).serverUrl ?? (process.env.NODE_ENV === 'development' ? 'https://chatbot-stg.charisma.digital' : null);
export const useSsl = Boolean((Array.isArray(host) ? host[0] : host)?.match(/^https:/));

export const Livechat = LivechatClientImpl.create(host.replace(/^http/, 'ws'));

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
