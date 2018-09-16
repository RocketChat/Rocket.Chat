Meteor.methods({
	checkTokenpassOAuthEnabled() {
		return !!(RocketChat.settings.get('Accounts_OAuth_Tokenpass'));
	}
});
