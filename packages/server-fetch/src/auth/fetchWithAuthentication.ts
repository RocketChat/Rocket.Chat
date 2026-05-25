import fetch from 'node-fetch';

import { buildDigestResponse } from './buildDigestResponse';
import { logger } from '../logger';
import type { ExtendedFetchOptions } from '../types';

export async function fetchWithAuthentication(
	url: URL,
	request: fetch.RequestInit & { headers: Record<string, string> },
	auth: ExtendedFetchOptions['auth'],
	response: fetch.Response,
): Promise<fetch.Response> {
	const urlString = url.toString();

	let authResponse: string;

	try {
		if (auth?.type !== 'digest' || !auth.username) {
			throw new Error('Credentials missing or invalid');
		}

		const authHeader = response.headers.get('www-authenticate');
		if (!authHeader) {
			throw new Error('Missing auth header');
		}

		const uri = url.pathname;
		const method = request.method || 'GET';

		authResponse = buildDigestResponse({
			uri,
			method,
			username: auth.username,
			password: auth.password,
			authHeader,
		});
	} catch (err) {
		logger.error({ msg: 'Failed to process Authentication for External Request', url: urlString, err });
		return response;
	}

	response.body?.resume();
	logger.info({ msg: 'Repeating External Request with Authentication', url: urlString });
	return fetch(urlString, { ...request, headers: { ...request.headers, Authorization: authResponse } });
}
