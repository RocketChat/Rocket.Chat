/* globals sync */

Meteor.methods({
	ldap_sync_users: function() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('unauthorized', '[methods] ldap_sync_users -> Unauthorized');
		}

		if (!RocketChat.authz.hasRole(user._id, 'admin')) {
			throw new Meteor.Error('unauthorized', '[methods] ldap_sync_users -> Unauthorized');
		}

		if (RocketChat.settings.get('LDAP_Enable') !== true) {
			throw new Meteor.Error('LDAP_disabled');
		}

		const result = sync();

		if (result === true) {
			return {
				message: 'Sync_success',
				params: []
			};
		}

		throw result;
	}
});
