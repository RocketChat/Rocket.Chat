import { LDAPEnterprise } from '@rocket.chat/core-services';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { ldapExamples } from './ldap.examples';
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
		summary: 'LDAP Sync',
		description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/premium.svg" alt="Premium tag" style="display: block; margin: auto;"></div>

Syncs your <a href="https://docs.rocket.chat/use-rocket.chat/authentication/ldap" target="_blank">LDAP data</a> based on the <a href="https://docs.rocket.chat/use-rocket.chat/authentication/ldap/ldap-data-sync-settings" target="_blank">data sync configurations</a>. This endpoints requires 2FA. <br>

Make sure LDAP is enabled in **Settings** > **LDAP** > **Enable** before using this endpoint.

Permission required: \`sync-auth-services-users\`.

### Changelog
| Version      | Description |
| ---------------- | ------------|
|5.2.0            | Include \`syncAvatars\`       |
|4.0.0            | Added       |`,
		examples: ldapExamples['ldap.syncNow'],
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

		await LDAPEnterprise.sync();
		await LDAPEnterprise.syncAvatarAndAbacAttributes();

		return API.v1.success({
			message: 'Sync_in_progress' as const,
		});
	},
);
