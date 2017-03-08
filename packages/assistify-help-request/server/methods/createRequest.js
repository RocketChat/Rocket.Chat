Meteor.methods({
	createRequest(name) {
		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createRequest' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-c')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createRequest' });
		}

		return RocketChat.createRoom('r', name, Meteor.user() && Meteor.user().username, [], false, {});
	}
});
