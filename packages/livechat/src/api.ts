import LivechatClient from '@rocket.chat/sdk/lib/clients/Livechat';
import { parse } from 'query-string';

const host =
	window.SERVER_URL || parse(window.location.search).serverUrl || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null);
export const useSsl = Boolean((Array.isArray(host) ? host[0] : host)?.match(/^https:/));

export const Livechat = new LivechatClient({ host, protocol: 'ddp', useSsl });
