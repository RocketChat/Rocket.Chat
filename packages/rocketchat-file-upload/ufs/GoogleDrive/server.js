import {UploadFS} from 'meteor/jalik:ufs';
import {google} from 'googleapis';
/**
 * GoogleDrive store
 * @param options
 * @constructor
 */
export class GoogleDriveStore extends UploadFS.Store {

	constructor(options) {
		super(options);

		const authObj = new google.auth.OAuth2(options.clientId, options.clientSecret, options.callbackUrl);
		authObj.credentials = { access_token: options.credentials.accessToken, refresh_token: options.credentials.refreshToken };

		this.drive = google.drive({
			version: 'v3',
			auth: authObj
		});

		options.getPath = options.getPath || function(file) {
			return file._id;
		};

		this.getPath = function(file) {
			if (file.GoogleDrive) {
				return file.GoogleDrive.path;
			}
		};

/*
		this.create = function(file, callback) {
			check(file, Object);

			let bufferStream = new stream.PassThrough();

			if (fileData) {
				bufferStream.end(fileData);
			} else {
				bufferStream = null;
			}

			const mediaObj = {
				mimeType: file.type,
				body: bufferStream
			};

			this.drive.files.create({
				media: mediaObj,
				fields: 'id'
			}, function(err, fileRes) {
				if (err) {
					console.log(err);
				} else {
					file._id = fileRes.id;
				}
			});

			if (file._id == null) {
				file._id = Random.id();
			}

			file.GoogleDrive = {
				path: this.options.getPath(file)
			};

			file.store = this.options.name; // assign store to file
		};
*/
	}
}

// Add store to UFS namespace
UploadFS.store.GoogleDrive = GoogleDriveStore;
