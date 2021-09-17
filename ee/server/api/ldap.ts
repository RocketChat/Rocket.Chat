import { hasRole } from '../../../app/authorization/server';
import { settings } from '../../../app/settings/server';
import { API } from '../../../app/api/server/api';
import { LDAPEE } from '../sdk';
import { hasLicense } from '../../app/license/server/license';

API.v1.addRoute('ldap.syncNow', { authRequired: true }, {
	post() {
		if (!this.userId) {
			throw new Error('error-invalid-user');
		}

		if (!hasRole(this.userId, 'admin')) {
			throw new Error('error-not-authorized');
		}

		if (!hasLicense('ldap-enterprise')) {
			throw new Error('error-not-authorized');
		}

		if (settings.get('LDAP_Enable') !== true) {
			throw new Error('LDAP_disabled');
		}

		LDAPEE.sync();

		return API.v1.success({
			message: 'Sync_in_progress',
		});
	},
});
