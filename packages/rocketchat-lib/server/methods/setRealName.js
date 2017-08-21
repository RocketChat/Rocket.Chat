Meteor.methods({
	setRealName(name) {

		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setRealName' });
		}

		if (!RocketChat.setRealName(Meteor.userId(), name)) {
			throw new Meteor.Error('error-could-not-change-name', 'Could not change name', { method: 'setRealName' });
		}

		return name;
	}
});

RocketChat.RateLimiter.limitMethod('setRealName', 1, 1000, {
	userId: () => true
});
