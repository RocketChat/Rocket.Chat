import google from 'googleapis';
const OAuth2 = google.auth.OAuth2;

RocketChat.API.v1.addRoute('livestream/oauth', {
	get: function functionName() {
		const clientAuth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), 'http://localhost:3000/api/v1/livestream/oauth/callback');
		const { userId } = this.queryParams;
		console.log('userId', userId);
		const url = clientAuth.generateAuthUrl({
			access_type: 'offline',
			scope: ['https://www.googleapis.com/auth/youtube'],
			state: JSON.stringify({
				userId
			})
		});

		return {
			statusCode: 302,
			headers: {
				Location: url
			}, body: 'Oauth redirect'
		};
	}
});

RocketChat.API.v1.addRoute('livestream/oauth/callback', {
	get: function functionName() {
		const { code, state } = this.queryParams;

		const { userId } = JSON.parse(state);

		const clientAuth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), 'http://localhost:3000/api/v1/livestream/oauth/callback');

		const ret = Meteor.wrapAsync(clientAuth.getToken.bind(clientAuth))(code);

		console.log(ret);

		RocketChat.models.Users.update({ _id: userId }, {$set: {
			'settings.livestream' : ret
		}});

		return {
			headers: {
				'content-type' : 'text/html'
			}, body: '<script>window.close()</script>'
		};
	}
});
