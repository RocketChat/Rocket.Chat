import { serverFetch } from '@rocket.chat/server-fetch';

import type { MitelConfig } from './definition';
import { logger } from '../logger';

export async function fetchMitelHistory(sipExtension: string, config: MitelConfig): Promise<string | null> {
	if (!sipExtension) {
		return null;
	}

	const directoryNumber = sipExtension.replace(/\D/g, '');
	if (!directoryNumber) {
		logger.warn({ msg: "User's sip extension does not include numeric digits", sipExtension });
		return null;
	}

	const separator = config.host.endsWith('/') ? '' : '/';
	const endpointUrl = `${config.host}${separator}callHistory/${directoryNumber}`;

	let response: Awaited<ReturnType<typeof serverFetch>>;

	try {
		logger.info({ msg: 'Fetching External call history', directoryNumber });
		response = await serverFetch(endpointUrl, {
			method: 'GET',
			// URL can only be configured by users with enough privileges, so it's fine to skip ssrf validation here
			ignoreSsrfValidation: true,
			auth: {
				type: 'digest',
				username: config.username,
				password: config.password,
			},
		});
	} catch (err) {
		logger.error({ msg: 'Failed to fetch External Call History', err });
		return null;
	}

	if (response.status !== 200) {
		logger.error({
			msg: 'Failed to fetch External Call History',
			status: response.status,
		});

		try {
			response.body?.resume();
		} catch {
			// ignore errors here
		}
		return null;
	}

	try {
		return Buffer.from(await response.arrayBuffer()).toString('utf8');
	} catch (err) {
		logger.error({
			msg: 'Failed to read External Call History',
			err,
		});
		return null;
	}
}
