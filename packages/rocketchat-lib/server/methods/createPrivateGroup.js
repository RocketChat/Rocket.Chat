Meteor.methods({
	createPrivateGroup(name, members, readOnly = false, customFields = {}, tokenpass = {}) {
		check(name, String);
		check(members, Match.Optional([String]));

		check(tokenpass, Match.Optional({
			tokens: Array,
			minimumBalance: Number
		}));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createPrivateGroup' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'create-p')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}

		return RocketChat.createRoom('p', name, Meteor.user() && Meteor.user().username, members, readOnly, {customFields, tokenpass});
	}
});
