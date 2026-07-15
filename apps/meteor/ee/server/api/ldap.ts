import { LDAPEnterprise } from '@rocket.chat/core-services';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { settings } from '../../../app/settings/server';
import { API } from '../../../server/api/api';
import { hasPermissionAsync } from '../../../server/lib/authorization/hasPermission';

const ldapSyncNowResponseSchema = ajv.compile<{ message: string }>({
	type: 'object',
	properties: {
		message: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['message', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'ldap.syncNow',
	{
		authRequired: true,
		forceTwoFactorAuthenticationForNonEnterprise: true,
		twoFactorRequired: true,
		response: {
			200: ldapSyncNowResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		if (!this.userId) {
			throw new Error('error-invalid-user');
		}

		if (!(await hasPermissionAsync(this.userId, 'sync-auth-services-users'))) {
			throw new Error('error-not-authorized');
		}

		if (settings.get('LDAP_Enable') !== true) {
			throw new Error('LDAP_disabled');
		}

		await LDAPEnterprise.sync();
		await LDAPEnterprise.syncAvatarAndAbacAttributes();

		return API.v1.success({
			message: 'Sync_in_progress' as const,
		});
	},
);
