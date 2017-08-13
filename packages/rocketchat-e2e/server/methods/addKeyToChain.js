Meteor.methods({
	addKeyToChain(key) {
		console.log(Meteor.userId());
		console.log(Meteor.userId);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addKeyToChain' });
		}
		return RocketChat.models.Users.addKeyToChain(key);
	}
});
