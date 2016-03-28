/* globals LDAP */

Meteor.methods({
	ldap_test_connection: function() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('unauthorized', '[methods] ldap_test_connection -> Unauthorized');
		}

		if (!RocketChat.authz.hasRole(user._id, 'admin')) {
			throw new Meteor.Error('unauthorized', '[methods] ldap_test_connection -> Unauthorized');
		}

		if (RocketChat.settings.get('LDAP_Enable') !== true) {
			throw new Meteor.Error('LDAP_disabled');
		}

		let ldap;
		try {
			ldap = new LDAP();
			ldap.connectSync();
		} catch(error) {
			console.log(error);
			throw new Meteor.Error(error.message);
		}

		try {
			ldap.bindIfNecessary();
			ldap.disconnect();
		} catch(error) {
			throw new Meteor.Error(error.name || error.message);
		}

		return {
			message: 'Connection_success',
			params: []
		};
	}
});
