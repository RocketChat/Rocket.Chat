import { hasRole } from '../../../app/authorization/server';
import { settings } from '../../../app/settings/server';
import { API } from '../../../app/api/server/api';
import { LDAPEE } from '../sdk';

API.v1.addRoute(
	'ldap.syncNow',
	{
		authRequired: true,
		forceTwoFactorAuthenticationForNonEnterprise: true,
		twoFactorRequired: true,
	},
	{
		async post() {
			if (!this.userId) {
				throw new Error('error-invalid-user');
			}

			if (!hasRole(this.userId, 'admin')) {
				throw new Error('error-not-authorized');
			}

			if (settings.get('LDAP_Enable') !== true) {
				throw new Error('LDAP_disabled');
			}

			await LDAPEE.sync();

			return API.v1.success({
				message: 'Sync_in_progress' as const,
			});
		},
	},
);
