Meteor.methods({
	insertOrUpdateUser(userData) {

		check(userData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateUser' });
		}

		return RocketChat.saveUser(Meteor.userId(), userData);
	}
});
