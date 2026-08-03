import { LDAP } from '@rocket.chat/core-services';
import { ajv, isLdapTestSearch, validateUnauthorizedErrorResponse, validateForbiddenErrorResponse } from '@rocket.chat/rest-typings';

import { ldapExamples } from './ldap.examples';
import { SystemLogger } from '../../lib/logger/system';
import { settings } from '../../settings';
import { API } from '../api';

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
		summary: 'Test LDAP Connection',
		description: `Test if Rocket.Chat can connect to the specified LDAP server using the port and host provided in the Rocket.Chat settings.
Make sure LDAP is enabled in **Settings** > **LDAP** > **Enable** before using this endpoint.

Permission required: \`test-admin-options\``,
		examples: ldapExamples['ldap.testConnection'],
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		response: {
			200: ajv.compile<{ message: string; success: true }>(messageResponseSchema),
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
			throw new Error('Connection_failed');
		}

		return API.v1.success({
			message: 'LDAP_Connection_successful' as const,
		});
	},
);

API.v1.post(
	'ldap.testSearch',
	{
		summary: 'Test LDAP User Search',
		description: `Test if a given username can be found in the LDAP server using the authentication and filter <a href='https://docs.rocket.chat/docs/configure-ldap-connection' target='_blank'>settings</a> provided to Rocket.Chat.
Make sure LDAP is enabled in **Settings** > **LDAP** > **Enable** before using this endpoint.

Permission required: \`test-admin-options\``,
		examples: ldapExamples['ldap.testSearch'],
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		body: isLdapTestSearch,
		response: {
			200: ajv.compile<{ message: string; success: true }>(messageResponseSchema),
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
			throw new Error('LDAP_search_failed');
		}

		return API.v1.success({
			message: 'LDAP_User_Found' as const,
		});
	},
);
