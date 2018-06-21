import {google} from 'googleapis';

Meteor.methods({
	checkDriveAccess() {
		const driveScope = 'https://www.googleapis.com/auth/drive';
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'checkDriveAccess' });
		}

		const id = Meteor.userId();
		const user = RocketChat.models.Users.findOne({_id: id});

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'checkDriveAccess' });
		}

		if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
			throw new Meteor.Error('error-google-unavailable', 'Google Service Unavailable', {method: 'checkDriveAccess'});
		}

		if (!user.services.google) {
			throw new Meteor.Error('error-unauthenticated-user', 'Unauthenticated User', {method: 'checkDriveAccess'});
		}

		const client = {
			clientId: RocketChat.settings.get('Accounts_OAuth_Google_id'),
			clientSecret: RocketChat.settings.get('Accounts_OAuth_Google_secret'),
			calllbackUrl: RocketChat.settings.get('Accounts_OAuth_Google_callback_url'),
			credentials: {
				token: user.services.google.accessToken,
				refreshToken: user.services.google.refreshToken,
				scopes: user.services.google.scope,
				expiresAt: user.services.google.expiresAt
			}
		};

		if (!client.credentials.token || !client.credentials.scopes || client.credentials.scopes.indexOf(driveScope) === -1) {
			throw new Meteor.Error('error-unauthenticated-user', 'Unauthenticated User', {method: 'checkDriveAccess'});
		}

		if (client.credentials.expiresAt < Date.now() + 60 * 1000) {
			const authObj = new google.auth.OAuth2(client.clientId, client.clientSecret, client.calllbackUrl);

			authObj.setCredentials({
				refresh_token: client.credentials.refreshToken
			});

			const refreshAccessTokenSync = Meteor.wrapAsync(authObj.refreshAccessToken, authObj);
			const tokens = refreshAccessTokenSync();

			Meteor.users.update({
				_id: id
			}, {
				$set: {
					'services.google.accessToken': tokens.access_token,
					'services.google.idToken': tokens.id_token,
					'services.google.expiresAt': tokens.expiry_date,
					'services.google.refreshToken': tokens.refresh_token
				}
			});
		}
	}
});
