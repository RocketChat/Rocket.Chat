Meteor.methods({
	setRealName(name) {

		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setRealName' });
		}

		const user = Meteor.user();

		if (user.name === name) {
			return name;
		}

		if (_.trim(name)) {
			name = _.trim(name);
		}

		if (!RocketChat.models.Users.setName(Meteor.userId(), name)) {
			throw new Meteor.Error('error-could-not-change-name', 'Could not change name', { method: 'setRealName' });
		}

		return name;
	}
});
