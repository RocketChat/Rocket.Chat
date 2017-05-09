
Meteor.methods({
	requestSlackOAuthToken(code) {
		check(code, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'requestSlackOAuthToken' });
		}

		const client_id = RocketChat.settings.get('SlackBridge_Client_ID');
		const client_secret = RocketChat.settings.get('SlackBridge_Client_Secret');
		const redirect_uri = RocketChat.settings.get('SlackBridge_OAuth_Redirect_Url');
		const data = {
			client_id: client_id,
			client_secret: client_secret,
			code: code,
			redirect_uri: redirect_uri
		};

		const postResult = HTTP.post('https://slack.com/api/oauth.access', { params: data });

		if (postResult.statusCode === 200 && postResult.data) {
			RocketChat.models.Users.setSlack(Meteor.userId(), postResult.data);
		}

		return code;
	}
});
