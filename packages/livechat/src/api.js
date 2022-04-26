import LivechatClient from '@rocket.chat/sdk/lib/clients/Livechat';
import queryString from 'query-string';

const host = window.SERVER_URL
	|| queryString.parse(window.location.search).serverUrl
	|| (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null);
export const useSsl = host && host.match(/^https:/) !== null;

export const Livechat = new LivechatClient({ host, protocol: 'ddp', useSsl });
