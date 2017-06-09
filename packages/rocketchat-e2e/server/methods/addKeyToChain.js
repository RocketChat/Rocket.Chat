Meteor.methods({
	addKeyToChain(key) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addKeyToChain' });
		}
		RocketChat.models.Users.addKeyToChain(key);
	}
});
