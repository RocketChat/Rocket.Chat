import google from 'googleapis';

import { settings } from '../../settings';
import { Users } from '../../models';
import { API } from '../../api/server';

const { OAuth2 } = google.auth;

API.v1.addRoute('livestream/oauth', {
	get: function functionName() {
		const clientAuth = new OAuth2(
			settings.get('Broadcasting_client_id'),
			settings.get('Broadcasting_client_secret'),
			`${settings.get('Site_Url')}/api/v1/livestream/oauth/callback`.replace(/\/{2}api/g, '/api'),
		);
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
			},
			body: 'Oauth redirect',
		};
	},
});

API.v1.addRoute('livestream/oauth/callback', {
	get: function functionName() {
		const { code, state } = this.queryParams;

		const { userId } = JSON.parse(state);

		const clientAuth = new OAuth2(
			settings.get('Broadcasting_client_id'),
			settings.get('Broadcasting_client_secret'),
			`${settings.get('Site_Url')}/api/v1/livestream/oauth/callback`.replace(/\/{2}api/g, '/api'),
		);

		const ret = Promise.await(clientAuth.getToken(code));

		Users.update(
			{ _id: userId },
			{
				$set: {
					'settings.livestream': ret,
				},
			},
		);

		return {
			headers: {
				'content-type': 'text/html',
			},
			body: '<script>window.close()</script>',
		};
	},
});
