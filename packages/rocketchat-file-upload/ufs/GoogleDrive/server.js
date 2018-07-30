import {UploadFS} from 'meteor/jalik:ufs';
import {google} from 'googleapis';
/**
 * WebDAV store
 * @param options
 * @constructor
 */
export class GoogleDriveStore extends UploadFS.Store {

	constructor(options) {

		super(options);

		const authObj = new google.auth.OAuth2(options.clientId, options.clientSecret, options.callbackUrl);
		authObj.credentials = { access_token: options.credentials.accessToken, refresh_token: options.credentials.refreshToken };

		const drive = google.drive({
			version: 'v3',
			auth: authObj
		});
	}
}

// Add store to UFS namespace
UploadFS.store.GoogleDrive = GoogleDriveStore;
