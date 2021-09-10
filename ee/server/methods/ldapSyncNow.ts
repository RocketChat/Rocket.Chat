import { Meteor } from 'meteor/meteor';

import { hasRole } from '../../../app/authorization/server';
import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

Meteor.methods({
	ldapSyncNow() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ldap_sync_users' } as any);
		}

		if (!hasRole(user._id, 'admin')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'ldap_sync_users' } as any);
		}

		if (settings.get('LDAP_Enable') !== true) {
			throw new Meteor.Error('LDAP_disabled');
		}

		LDAPEE.sync();

		return {
			message: 'Sync_in_progress',
			params: [],
		};
	},
});
