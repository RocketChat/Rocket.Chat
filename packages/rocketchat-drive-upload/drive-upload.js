import {providers} from 'meteor/rocketchat:grant';
import {google} from 'googleapis';

const drive = google.drive({
	version: 'v3',
	//auth: client.oAuth2Client
});

function getAccessToken((id) => {
	// return token if exists else call for authorization
});


Meteor.methods({
	async 'uploadFileToDrive'(file) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'uploadFileToDrive' });
		}
		const id = Meteor.userId();
		const user = RocketChat.models.Users.findOne({_id: id});
		const token = user.accessToken || getAccessToken(id);
		const scopes = user.scopes;
		if (scopes.indexOf('https://www.googleapis.com/auth/drive.file') == -1) {
			requestScope('https://www.googleapis.com/auth/drive.file');
		}

		const res = await drive.files.create({
			requestBody: {

			},
			media: {
				body: fileData
			}
		},
		{
			onUploadProgress: evt => {
				const progress = (evt.bytesRead / fileSize) * 100;
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write(`${Math.round(progress)}% complete`);
			}
		});
		console.log(res.data);
	}
});
