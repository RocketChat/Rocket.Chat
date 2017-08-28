Meteor.methods({
	createPrivateGroup(name, members, readOnly = false, customFields = {}, tokens, minimumTokenBalance) {
		check(name, String);
		check(members, Match.Optional([String]));

		check(tokens, Match.Optional(String));
		check(minimumTokenBalance, Match.Optional(Number));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createPrivateGroup' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-p')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}

		return RocketChat.createRoom('p', name, Meteor.user() && Meteor.user().username, members, readOnly, {customFields}, tokens, minimumTokenBalance);
	}
});
