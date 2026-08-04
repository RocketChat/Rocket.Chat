import { LDAP, isMeteorError } from '@rocket.chat/core-services';
import {
	ajv,
	isLdapTestSearch,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { getLdapErrorReason } from '../lib/ldap/getLdapErrorReason';
import { SystemLogger } from '../../../server/lib/logger/system';
import { settings } from '../../../server/settings';
import { API } from '../../../server/api/api';

const messageResponseSchema = {
	type: 'object' as const,
	properties: {
		message: { type: 'string' as const },
		success: {
			type: 'boolean' as const,
			enum: [true] as const,
		},
	},
	required: ['message', 'success'] as const,
	additionalProperties: false,
};

API.v1.post(
	'ldap.testConnection',
	{
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		license: ['ldap-enterprise'],
		response: {
			200: ajv.compile<{ message: string; success: true }>(messageResponseSchema),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		if (!this.userId) {
			throw new Error('error-invalid-user');
		}

		if (settings.get<boolean>('LDAP_Enable') !== true) {
			throw new Error('LDAP_disabled');
		}

		try {
			await LDAP.testConnection();
		} catch (err) {
			SystemLogger.error({ err });
			if (isMeteorError(err)) {
				return API.v1.failure({ error: String(err.error), details: err.details });
			}

			return API.v1.failure({
				error: 'LDAP_Connection_failed_reason',
				errorType: 'error-ldap-connection-failed',
				details: { reason: getLdapErrorReason(err) },
			});
		}

		return API.v1.success({
			message: 'LDAP_Connection_successful' as const,
		});
	},
);

API.v1.post(
	'ldap.testSearch',
	{
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		license: ['ldap-enterprise'],
		body: isLdapTestSearch,
		response: {
			200: ajv.compile<{ message: string; success: true }>(messageResponseSchema),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		if (!this.userId) {
			throw new Error('error-invalid-user');
		}

		if (settings.get<boolean>('LDAP_Enable') !== true) {
			throw new Error('LDAP_disabled');
		}

		try {
			await LDAP.testSearch(this.bodyParams.username);
		} catch (err) {
			SystemLogger.error({ err });
			if (isMeteorError(err)) {
				return API.v1.failure({ error: String(err.error), details: err.details });
			}

			return API.v1.failure('LDAP_search_failed');
		}

		return API.v1.success({
			message: 'LDAP_User_Found' as const,
		});
	},
);
