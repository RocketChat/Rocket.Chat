import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { API } from 'meteor/rocketchat:api';
import google from 'googleapis';
const { OAuth2 } = google.auth;

API.v1.addRoute('livestream/oauth', {
	get: function functionName() {
		const clientAuth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), `${ RocketChat.settings.get('Site_Url') }/api/v1/livestream/oauth/callback`.replace(/\/{2}api/g, '/api'));
		const { userId } = this.queryParams;
		const url = clientAuth.generateAuthUrl({
			access_type: 'offline',
			scope: ['https://www.googleapis.com/auth/youtube'],
			state: JSON.stringify({
				userId,
			}),
		});

		return {
			statusCode: 302,
			headers: {
				Location: url,
			}, body: 'Oauth redirect',
		};
	},
});

API.v1.addRoute('livestream/oauth/callback', {
	get: function functionName() {
		const { code, state } = this.queryParams;

		const { userId } = JSON.parse(state);

		const clientAuth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), `${ RocketChat.settings.get('Site_Url') }/api/v1/livestream/oauth/callback`.replace(/\/{2}api/g, '/api'));

		const ret = Meteor.wrapAsync(clientAuth.getToken.bind(clientAuth))(code);

		RocketChat.models.Users.update({ _id: userId }, { $set: {
			'settings.livestream' : ret,
		} });

		return {
			headers: {
				'content-type' : 'text/html',
			}, body: '<script>window.close()</script>',
		};
	},
});
