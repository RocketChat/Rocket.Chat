import { ajv, validateUnauthorizedErrorResponse, validateForbiddenErrorResponse } from '@rocket.chat/rest-typings';

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
	type: 'object' as const,
	properties: {
		provider: { type: 'string' as const },
		message: { type: 'string' as const },
		success: { type: 'boolean' as const, enum: [true] as const },
	},
	required: ['provider', 'message', 'success'] as const,
	additionalProperties: false,
};

API.v1.post(
	'exchange.testConnection',
	{
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		response: {
			200: ajv.compile<{ provider: string; message: string; success: true }>(testConnectionResponse),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		if (!isServerSyncEnabled()) {
			throw new Error('Outlook_Calendar_Server_Sync_Disabled');
		}

		const provider = getExchangeProvider();

		try {
			await provider.testConnection();
		} catch (err) {
			logger.error({ msg: 'Exchange test connection failed', provider: provider.id, err: scrubForLog(err) });

			throw new Error(isExchangeError(err) ? ERROR_MESSAGES[err.code] : 'Outlook_Calendar_Test_Connection_failed', { cause: err });
		}

		return API.v1.success({
			provider: provider.id,
			message: 'Outlook_Calendar_Test_Connection_successful',
		});
	},
);
