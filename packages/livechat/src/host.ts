import { parse } from 'query-string';

const parsedServerUrl =
	window.SERVER_URL ?? parse(window.location.search).serverUrl ?? `${window.location.protocol}//${window.location.host}`;

export const host = Array.isArray(parsedServerUrl) ? parsedServerUrl[0] : parsedServerUrl;
export const useSsl = Boolean(host?.match(/^https:/));
