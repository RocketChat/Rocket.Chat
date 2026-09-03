import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { getExchangeProvider, isServerSyncEnabled } from '../lib/exchange/ExchangeProviderRegistry';
import type { ExchangeErrorCode } from '../lib/exchange/errors';
import { isExchangeError } from '../lib/exchange/errors';
import { logger } from '../lib/exchange/logger';
import { scrubForLog } from '../lib/exchange/scrub';

const ERROR_MESSAGES: Record<ExchangeErrorCode, string> = {
	'not-configured': 'Outlook_Calendar_Test_Connection_not_configured',
	'authentication-failed': 'Outlook_Calendar_Test_Connection_authentication_failed',
	'authorization-failed': 'Outlook_Calendar_Test_Connection_authorization_failed',
	'mailbox-not-found': 'Outlook_Calendar_Test_Connection_mailbox_not_found',
	'connection-failed': 'Outlook_Calendar_Test_Connection_connection_failed',
	'host-not-allowed': 'Outlook_Calendar_Test_Connection_host_not_allowed',
	'rate-limited': 'Outlook_Calendar_Test_Connection_rate_limited',
	'unexpected-response': 'Outlook_Calendar_Test_Connection_unexpected_response',
};

const testConnectionResponse = {
	type: 'object',
	properties: {
		provider: { type: 'string' },
		message: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['provider', 'message', 'success'],
	additionalProperties: false,
};

API.v1.post(
	'exchange.testConnection',
	{
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		response: {
			200: ajv.compile<{ provider: string; message: string; success: true }>(testConnectionResponse),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		if (!isServerSyncEnabled()) {
			return API.v1.failure('Outlook_Calendar_Server_Sync_Disabled');
		}

		const provider = getExchangeProvider();

		try {
			await provider.testConnection();
		} catch (err) {
			logger.error({ msg: 'Exchange test connection failed', provider: provider.id, err: scrubForLog(err) });

			return API.v1.failure(isExchangeError(err) ? ERROR_MESSAGES[err.code] : 'Outlook_Calendar_Test_Connection_failed');
		}

		return API.v1.success({
			provider: provider.id,
			message: 'Outlook_Calendar_Test_Connection_successful',
		});
	},
);
