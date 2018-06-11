import {google} from 'googleapis';
import stream from 'stream';

Meteor.methods({
	checkDriveAccess() {
		const id = Meteor.userId();
		const driveScope = 'https://www.googleapis.com/auth/drive';
		const user = RocketChat.models.Users.findOne({_id: id});

		if (!user || !user.services.google) {
			return false;
		}

		const token = user.services.google.accessToken;
		const scopes = user.services.google.scope;

		if (!token || !scopes || scopes.indexOf(driveScope) === -1) {
			return false;
		}

		return true;
	}
});


Meteor.methods({
	async 'uploadFileToDrive'({fileData, metaData}) {
		const driveScope = 'https://www.googleapis.com/auth/drive';

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'uploadFileToDrive' });
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
				scopes: user.services.google.scope
			}
		};

		if (!client.credentials.token || !client.credentials.scopes || client.credentials.scopes.indexOf(driveScope) === -1) {
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


Meteor.methods({
	async createGoogleFile({type, name}) {
		const mimeTypes = {
			'docs': 'application/vnd.google-apps.document',
			'slides': 'application/vnd.google-apps.presentation',
			'sheets': 'application/vnd.google-apps.spreadsheet'
		};

		const fileData = null;
		const metaData = {
			'mimeType': `${ mimeTypes[type] }`,
			'name': `${ name }`
		};

		Meteor.call('uploadFileToDrive', {fileData, metaData});
	}
});
