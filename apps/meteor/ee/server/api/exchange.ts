import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateInternalErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { getExchangeProvider, isServerSyncEnabled } from '../lib/exchange/ExchangeProviderRegistry';
import type { ExchangeErrorCode } from '../lib/exchange/errors';
import { isExchangeError } from '../lib/exchange/errors';
import { logger } from '../lib/exchange/logger';
import { scrubForLog } from '../lib/exchange/scrub';
import { syncUserMailbox } from '../lib/exchange/sync/syncUserMailbox';

const ERROR_MESSAGES: Record<ExchangeErrorCode, string> = {
	'not-configured': 'Outlook_Calendar_Test_Connection_not_configured',
	'authentication-failed': 'Outlook_Calendar_Test_Connection_authentication_failed',
	'authorization-failed': 'Outlook_Calendar_Test_Connection_authorization_failed',
	'mailbox-not-found': 'Outlook_Calendar_Test_Connection_mailbox_not_found',
	'email-not-verified': 'Outlook_Calendar_Sync_email_not_verified',
	'connection-failed': 'Outlook_Calendar_Test_Connection_connection_failed',
	'host-not-allowed': 'Outlook_Calendar_Test_Connection_host_not_allowed',
	'rate-limited': 'Outlook_Calendar_Test_Connection_rate_limited',
	'unexpected-response': 'Outlook_Calendar_Test_Connection_unexpected_response',
	'sync-state-invalid': 'Outlook_Calendar_Test_Connection_sync_state_invalid',
};

const TEST_CONNECTION_SERVER_FAULTS: ReadonlySet<ExchangeErrorCode> = new Set(['unexpected-response', 'sync-state-invalid']);

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
			500: validateInternalErrorResponse,
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

			if (!isExchangeError(err)) {
				return API.v1.internalError('Outlook_Calendar_Test_Connection_failed');
			}

			return TEST_CONNECTION_SERVER_FAULTS.has(err.code)
				? API.v1.internalError(ERROR_MESSAGES[err.code])
				: API.v1.failure(ERROR_MESSAGES[err.code]);
		}

		return API.v1.success({
			provider: provider.id,
			message: 'Outlook_Calendar_Test_Connection_successful',
		});
	},
);

const USER_FIXABLE_SYNC_ERRORS: ReadonlySet<ExchangeErrorCode> = new Set(['email-not-verified', 'mailbox-not-found', 'rate-limited']);

const syncResponse = {
	type: 'object',
	properties: {
		upserted: { type: 'integer' },
		modified: { type: 'integer' },
		deleted: { type: 'integer' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['upserted', 'modified', 'deleted', 'success'],
	additionalProperties: false,
};

API.v1.post(
	'exchange.syncMyCalendar',
	{
		authRequired: true,
		// Every call is a full window fetch against the tenant, so this is deliberately tighter than a read
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: {
			200: ajv.compile<{ upserted: number; modified: number; deleted: number; success: true }>(syncResponse),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			500: validateInternalErrorResponse,
		},
	},
	async function action() {
		if (!isServerSyncEnabled()) {
			return API.v1.failure('Outlook_Calendar_Server_Sync_Disabled');
		}

		try {
			const { upserted, modified, deleted } = await syncUserMailbox(this.userId);

			return API.v1.success({ upserted, modified, deleted });
		} catch (err) {
			logger.error({ msg: 'On-demand Exchange sync failed', uid: this.userId, err: scrubForLog(err) });

			if (!isExchangeError(err)) {
				return API.v1.internalError('Outlook_Sync_Failed');
			}

			return USER_FIXABLE_SYNC_ERRORS.has(err.code)
				? API.v1.failure(ERROR_MESSAGES[err.code])
				: API.v1.internalError(ERROR_MESSAGES[err.code]);
		}
	},
);
