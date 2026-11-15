import { LDAPEnterprise } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import { hasPermissionAsync } from '../../../server/lib/authorization/hasPermission';
import { settings } from '../../../server/settings';

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

		if (!(await hasPermissionAsync(this.user, 'sync-auth-services-users'))) {
			throw new Error('error-not-authorized');
		}

		if (settings.get('LDAP_Enable') !== true) {
			throw new Error('LDAP_disabled');
		}

		if (
			settings.get('LDAP_Background_Sync') !== true &&
			settings.get('LDAP_Background_Sync_Avatars') !== true &&
			!(settings.get('LDAP_Background_Sync_ABAC_Attributes') === true && License.hasModule('abac') && settings.get('ABAC_Enabled') === true)
		) {
			throw new Error('LDAP_Background_Sync_disabled');
		}

		try {
			await LDAPEnterprise.sync();
			await LDAPEnterprise.syncAvatarAndAbacAttributes();
		} catch (err) {
			return API.v1.failure({ error: 'LDAP_Sync_failed', details: { error: err instanceof Error ? err.message : String(err) } });
		}

		return API.v1.success({
			message: 'Sync_in_progress' as const,
		});
	},
);
