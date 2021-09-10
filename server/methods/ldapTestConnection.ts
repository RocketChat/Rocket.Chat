import { Meteor } from 'meteor/meteor';

import { LDAPManager } from '../lib/ldap/Manager';
import { hasRole } from '../../app/authorization/server';
import { settings } from '../../app/settings/server';
import { SystemLogger } from '../lib/logger/system';

async function testConnection(): Promise<void> {
	try {
		const ldap = LDAPManager.getNewConnection();
		await ldap.testConnection();
	} catch (error) {
		SystemLogger.error(error);
		throw new Meteor.Error(error.message);
	}
}

Meteor.methods({
	ldapTestConnection() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ldapTestConnection' });
		}

		if (!hasRole(user._id, 'admin')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'ldapTestConnection' });
		}

		if (settings.get('LDAP_Enable') !== true) {
			throw new Meteor.Error('LDAP_disabled');
		}

		Promise.await(testConnection());

		return {
			message: 'Connection_success',
			params: [],
		};
	},
});
