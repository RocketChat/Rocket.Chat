import { Meteor } from 'meteor/meteor';
import { hasRole } from 'meteor/rocketchat:authorization';
import { settings } from 'meteor/rocketchat:settings';
import { importNewUsers } from './sync';

Meteor.methods({
	ldap_sync_now() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ldap_sync_users' });
		}

		if (!hasRole(user._id, 'admin')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'ldap_sync_users' });
		}

		if (settings.get('LDAP_Enable') !== true) {
			throw new Meteor.Error('LDAP_disabled');
		}

		this.unblock();

		importNewUsers();

		return {
			message: 'Sync_in_progress',
			params: [],
		};
	},
});
