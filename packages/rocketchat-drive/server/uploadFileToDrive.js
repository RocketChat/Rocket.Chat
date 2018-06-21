import {google} from 'googleapis';
import stream from 'stream';

Meteor.methods({
	async 'uploadFileToDrive'({fileData, metaData}) {
		const driveScope = 'https://www.googleapis.com/auth/drive';

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', { method: 'uploadFileToDrive' });
		}

		const id = Meteor.userId();
		const user = RocketChat.models.Users.findOne({_id: id});

		if (!RocketChat.settings.get('Accounts_OAuth_Google')) {
			throw new Meteor.Error('error-google-unavailable', 'Google Services Unavailable', {method: 'uploadFileToDrive'});
		}

		if (!user.services.google) {
			throw new Meteor.Error('error-unauthenticated-user', 'Unauthenticated User', {method: 'uploadFileToDrive'});
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

		if (!client.credentials.token || !client.credentials.scopes || client.credentials.scopes.indexOf(driveScope) === -1 || client.credentials.expiresAt < Date.now() + 60 * 1000) {
			throw new Meteor.Error('error-unauthenticated-user', 'Unauthenticated User', {method: 'uploadFileToDrive'});
		}

		const authObj = new google.auth.OAuth2(client.clientId, client.clientSecret, client.calllbackUrl);

		authObj.credentials = {
			access_token: client.credentials.token,
			refresh_token: client.credentials.refreshToken
		};

		const drive = google.drive({
			version: 'v3',
			auth: authObj
		});

		let bufferStream = new stream.PassThrough();

		if (fileData) {
			bufferStream.end(fileData);
		} else {
			bufferStream = null;
		}

		const mediaObj = {
			mimeType: metaData['mimeType'],
			body: bufferStream
		};

		const res = await drive.files.create({
			resource: metaData,
			media: mediaObj,
			fields: 'id'
		}, function(err, file) {
			if (err) {
				console.log(err);
			} else {
				console.log(file);
			}
		});

		return res;
	}
});
