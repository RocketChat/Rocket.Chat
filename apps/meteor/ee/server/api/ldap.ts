import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../../../app/api/server/ApiClass';
import { API } from '../../../app/api/server/api';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

const ldapEndpoints = API.v1.post(
	'ldap.syncNow',
	{
		authRequired: true,
		forceTwoFactorAuthenticationForNonEnterprise: true,
		twoFactorRequired: true,
		body: ajv.compile<undefined>(false),
		// license: ['ldap-enterprise'],
		response: {
			200: ajv.compile<{
				message: string;
			}>({
				type: 'object',
				properties: {
					message: {
						type: 'string',
						enum: ['Sync_in_progress'],
					},
					success: {
						type: 'boolean',
						enum: [true],
						description: 'Whether the connection was successful or not',
					},
				},
				required: ['success', 'message'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},

	async function action() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user');
		}

		if (!(await hasPermissionAsync(this.userId, 'sync-auth-services-users'))) {
			throw new Meteor.Error('error-not-authorized');
		}

		if (settings.get('LDAP_Enable') !== true) {
			throw new Meteor.Error('LDAP_disabled');
		}

		await LDAPEE.sync();
		await LDAPEE.syncAvatars();

		return API.v1.success({
			message: 'Sync_in_progress' as const,
		});
	},
);

export type LdapEndpoints = ExtractRoutesFromAPI<typeof ldapEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LdapEndpoints {}
}
