import { API } from '../../../app/api/server/api';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

API.v1.addRoute(
	'ldap.syncNow',
	{
		authRequired: true,
		forceTwoFactorAuthenticationForNonEnterprise: true,
		twoFactorRequired: true,
		// license: ['ldap-enterprise'],
	},
	{
		async post() {
			if (!this.userId) {
				throw new Error('error-invalid-user');
			}

			if (!(await hasPermissionAsync(this.userId, 'sync-auth-services-users'))) {
				throw new Error('error-not-authorized');
			}

			if (settings.get('LDAP_Enable') !== true) {
				throw new Error('LDAP_disabled');
			}

			await LDAPEE.sync();
			await LDAPEE.syncAvatars();

			return API.v1.success({
				message: 'Sync_in_progress' as const,
			});
		},
	},
);
