import {
	validateBadRequestErrorResponse,
	ajv,
	validateForbiddenErrorResponse,
	validateInternalErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { settings } from '../../../server/settings';
import { getExchangeProvider, isServerSyncEnabled } from '../lib/exchange/ExchangeProviderRegistry';
import type { ExchangeErrorCode } from '../lib/exchange/errors';
import { isExchangeError } from '../lib/exchange/errors';
import { logger } from '../lib/exchange/logger';
import { scrubForLog } from '../lib/exchange/scrub';
import { syncCalendarForUser } from '../lib/exchange/sync/calendar/syncCalendarForUser';
import { syncContactsForUser } from '../lib/exchange/sync/contacts/syncContactsForUser';

const ERROR_MESSAGES: Record<ExchangeErrorCode, string> = {
	'not-configured': 'Exchange_Test_Connection_not_configured',
	'authentication-failed': 'Exchange_Test_Connection_authentication_failed',
	'authorization-failed': 'Exchange_Test_Connection_authorization_failed',
	'mailbox-not-found': 'Exchange_Test_Connection_mailbox_not_found',
	'email-not-verified': 'Exchange_Sync_email_not_verified',
	'connection-failed': 'Exchange_Test_Connection_connection_failed',
	'host-not-allowed': 'Exchange_Test_Connection_host_not_allowed',
	'rate-limited': 'Exchange_Test_Connection_rate_limited',
	'unexpected-response': 'Exchange_Test_Connection_unexpected_response',
	'sync-state-invalid': 'Exchange_Test_Connection_sync_state_invalid',
};

const TEST_CONNECTION_SERVER_FAULTS: ReadonlySet<ExchangeErrorCode> = new Set(['unexpected-response', 'sync-state-invalid']);

API.v1.post(
	'exchange.testConnection',
	{
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		license: ['outlook-calendar'],
		response: {
			200: ajv.compile<{ provider: string; message: string; success: true }>({
				type: 'object',
				properties: {
					provider: { type: 'string' },
					message: { type: 'string' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['provider', 'message', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			500: validateInternalErrorResponse,
		},
	},
	async function action() {
		if (!isServerSyncEnabled()) {
			return API.v1.failure('Exchange_Server_Sync_Disabled');
		}

		const provider = getExchangeProvider();

		try {
			await provider.testConnection();
		} catch (err) {
			logger.error({ msg: 'Exchange test connection failed', provider: provider.id, err: scrubForLog(err) });

			if (!isExchangeError(err)) {
				return API.v1.internalError('Exchange_Test_Connection_failed');
			}

			return TEST_CONNECTION_SERVER_FAULTS.has(err.code)
				? API.v1.internalError(ERROR_MESSAGES[err.code])
				: API.v1.failure(ERROR_MESSAGES[err.code]);
		}

		return API.v1.success({
			provider: provider.id,
			message: 'Exchange_Test_Connection_successful',
		});
	},
);

const USER_FIXABLE_SYNC_ERRORS: ReadonlySet<ExchangeErrorCode> = new Set(['email-not-verified', 'mailbox-not-found', 'rate-limited']);

API.v1.post(
	'exchange.syncMyCalendar',
	{
		authRequired: true,
		license: ['outlook-calendar'],
		// Every call is a full window fetch against the tenant, so this is deliberately tighter than a read
		rateLimiterOptions: { numRequestsAllowed: 5, intervalTimeInMS: 60000 },
		response: {
			200: ajv.compile<{
				upserted: number;
				modified: number;
				deleted: number;
				success: true;
			}>({
				type: 'object',
				properties: {
					upserted: { type: 'integer' },
					modified: { type: 'integer' },
					deleted: { type: 'integer' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['upserted', 'modified', 'deleted', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			500: validateInternalErrorResponse,
		},
	},
	async function action() {
		if (!isServerSyncEnabled()) {
			return API.v1.failure('Exchange_Server_Sync_Disabled');
		}

		try {
			const { upserted, modified, deleted } = await syncCalendarForUser(this.userId);

			return API.v1.success({ upserted, modified, deleted });
		} catch (err) {
			logger.error({ msg: 'On-demand Exchange calendar sync failed', uid: this.userId, err: scrubForLog(err) });

			if (!isExchangeError(err)) {
				return API.v1.internalError('Outlook_Sync_Failed');
			}

			return USER_FIXABLE_SYNC_ERRORS.has(err.code)
				? API.v1.failure(ERROR_MESSAGES[err.code])
				: API.v1.internalError(ERROR_MESSAGES[err.code]);
		}
	},
);

API.v1.post(
	'exchange.syncMyContacts',
	{
		authRequired: true,
		license: ['outlook-calendar'],
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60000 },
		response: {
			200: ajv.compile<{
				folders: number;
				upserted: number;
				modified: number;
				deleted: number;
				pruned: number;
				success: true;
			}>({
				type: 'object',
				properties: {
					folders: { type: 'integer' },
					upserted: { type: 'integer' },
					modified: { type: 'integer' },
					deleted: { type: 'integer' },
					pruned: { type: 'integer' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['folders', 'upserted', 'modified', 'deleted', 'pruned', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			500: validateInternalErrorResponse,
		},
	},
	async function action() {
		if (!isServerSyncEnabled()) {
			return API.v1.failure('Exchange_Server_Sync_Disabled');
		}

		if (!settings.get<boolean>('Exchange_Contacts_Sync_Enabled')) {
			return API.v1.failure('Exchange_Contacts_Sync_Disabled');
		}

		try {
			const { folders, upserted, modified, deleted, pruned } = await syncContactsForUser(this.userId);

			return API.v1.success({ folders, upserted, modified, deleted, pruned });
		} catch (err) {
			logger.error({ msg: 'On-demand Exchange contact sync failed', uid: this.userId, err: scrubForLog(err) });

			if (!isExchangeError(err)) {
				return API.v1.internalError('Outlook_Sync_Failed');
			}

			return USER_FIXABLE_SYNC_ERRORS.has(err.code)
				? API.v1.failure(ERROR_MESSAGES[err.code])
				: API.v1.internalError(ERROR_MESSAGES[err.code]);
		}
	},
);
