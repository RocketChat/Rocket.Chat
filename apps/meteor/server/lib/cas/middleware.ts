import type { IncomingMessage, ServerResponse } from 'http';
import url from 'url';

import { validate } from '@rocket.chat/cas-validate';
import type { ICredentialToken } from '@rocket.chat/core-typings';
import { CredentialTokens } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { logger } from './logger';

const closePopup = function (res: ServerResponse): void {
	res.writeHead(200, { 'Content-Type': 'text/html' });
	const content = '<html><head><script>window.close()</script></head></html>';
	res.end(content, 'utf-8');
};

type IncomingMessageWithUrl = IncomingMessage & Required<Pick<IncomingMessage, 'url'>>;

const casTicket = function (req: IncomingMessageWithUrl, token: string, callback: () => void): void {
	// get configuration
	if (!settings.get('CAS_enabled')) {
		logger.error('Got ticket validation request, but CAS is not enabled');
		callback();
	}

	// get ticket and validate.
	const parsedUrl = url.parse(req.url, true);
	const ticketId = parsedUrl.query.ticket as string;
	const baseUrl = settings.get<string>('CAS_base_url');
	const version = parseFloat(settings.get('CAS_version') ?? '1.0') as 1.0 | 2.0;
	const appUrl = Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
	logger.debug(`Using CAS_base_url: ${baseUrl}`);

	validate(
		{
			base_url: baseUrl,
			version,
			service: `${appUrl}/_cas/${token}`,
		},
		ticketId,
		async (err, status, username, details) => {
			if (err) {
				logger.error(`error when trying to validate: ${err.message}`);
			} else if (status) {
				logger.info(`Validated user: ${username}`);
				const userInfo: Partial<ICredentialToken['userInfo']> = { username: username as string };

				// CAS 2.0 attributes handling
				if (details?.attributes) {
					Object.assign(userInfo, { attributes: details.attributes });
				}
				await CredentialTokens.create(token, userInfo);
			} else {
				logger.error(`Unable to validate ticket: ${ticketId}`);
			}
			// logger.debug("Received response: " + JSON.stringify(details, null , 4));

			callback();
		},
	);
};

export const middlewareCAS = function (req: IncomingMessage, res: ServerResponse, next: (err?: any) => void) {
	// Make sure to catch any exceptions because otherwise we'd crash
	// the runner
	try {
		if (!req.url) {
			throw new Error('Invalid request url');
		}

		const barePath = req.url.substring(0, req.url.indexOf('?'));
		const splitPath = barePath.split('/');

		// Any non-cas request will continue down the default
		// middlewares.
		if (splitPath[1] !== '_cas') {
			next();
			return;
		}

		// get auth token
		const credentialToken = splitPath[2];
		if (!credentialToken) {
			closePopup(res);
			return;
		}

		// validate ticket
		casTicket(req as IncomingMessageWithUrl, credentialToken, () => {
			closePopup(res);
		});
	} catch (err) {
		logger.error({ msg: 'Unexpected error', err });
		closePopup(res);
	}
};
