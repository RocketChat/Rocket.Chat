Meteor.methods({
	addKeyToChain(key) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addKeyToChain' });
		}
		return RocketChat.models.Users.addKeyToChain(key);
	}
});
