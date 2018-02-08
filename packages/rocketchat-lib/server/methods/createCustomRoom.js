Meteor.methods({
	createCustomRoom(type, name, members, customFields = {}) {
		if (!process.env.TEST_MODE) {
			throw new Meteor.Error('This method is currently only intended for testing');
		}

		check(name, String);
		check(members, Match.Optional([String]));
		check(type, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-c')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
		}

		return RocketChat.createRoom(type, name, Meteor.user() && Meteor.user().username, members, false, {customFields});
	}
});
