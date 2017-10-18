Meteor.methods({
	createExpertise(name, members) {
		check(name, String);
		check(members, Array);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createExpertise' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-e')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createExpertise' });
		}

		if (!members || members.length === 0) {
			throw new Meteor.Error('error-no-members', 'No members supplied', { method: 'createExpertise' });
		}

		return RocketChat.createRoom('e', name, Meteor.user() && Meteor.user().username, members, false, {});
	}
});
