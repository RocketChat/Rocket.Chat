
Template.accountSlack.events({
	'click .revoke-token'() {
		Meteor.call('revokeSlackOAuthToken');
	}
});

Template.accountSlack.helpers({
	hasSlackAccount() {
		const user = Meteor.user();
		return (user && user.settings && user.settings.slack);
	},
	slackAccessToken() {
		const user = Meteor.user();
		return user.settings.slack.access_token;
	},
	authorizationUrl() {
		const client_id = RocketChat.settings.get('SlackBridge_Client_ID');
		const scopes = RocketChat.settings.get('SlackBridge_OAuth_Scopes');
		const redirect_uri = RocketChat.settings.get('SlackBridge_OAuth_Redirect_Url');

		return `https://slack.com/oauth/authorize?scope=${ scopes }&client_id=${ client_id }&redirect_uri=${ redirect_uri }`;
	}
});
