//import {Providers} from 'meteor/rocketchat:grant';
import {google} from 'googleapis';
//import {getUser} from 'rocketchat:grant-google';

Meteor.methods({
	checkDriveAccess() {
		const id = Meteor.userId();
		const driveScope = 'https://www.googleapis.com/auth/drive.file';
		const user = RocketChat.models.Users.findOne({_id: id});

		if (!user) {
			return false;
		}

		const token = user.accessToken;
		const scopes = user.scopes;

		if (!token || !scopes || scopes.indexOf(driveScope) === -1) {
			return false;
		}

		return true;
	}
});



Meteor.methods({
	async 'uploadFileToDrive'(file, metaData) {
		const driveScope = 'https://www.googleapis.com/auth/drive.file';

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'uploadFileToDrive' });
		}

		const id = Meteor.userId();
		const user = RocketChat.models.Users.findOne({_id: id});
		const token = user.accessToken;
		const scopes = user.scopes;

		if (!token || !scopes || scopes.indexOf(driveScope) === -1) {
			return;
		}

		const drive = google.drive({
			version: 'v3',
			auth: token
		});

		const res = await drive.files.create({
			requestBody: {
				name: metaData.name,
				mimeType: metaData.type
			},
			media: {
				name: metaData.type,
				body: file
			}
		}, function(err, file) {
			if (err) {
				console.log(err);
			} else {
				console.log(file.id);
			}
		});
	}
});
