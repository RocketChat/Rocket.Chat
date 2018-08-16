/* eslint-disable */
/* globals FileUpload */
import _ from 'underscore';
import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/GoogleDrive/server.js';

const get = function(file, req, res) {

};

const copy = function(file, req, res) {

}

const GoogleDriveUploads = new FileUploadClass({
	name: 'GoogleDrive:Uploads',
	get,
	copy
	// store setted below
});

const GoogleDriveAvatars = new FileUploadClass({
	name: 'GoogleDrive:Avatars',
	get,
	copy
	// store setted below
});

const GoogleDriveUserDataFiles = new FileUploadClass({
	name: 'GoogleDrive:UserDataFiles',
	get,
	copy
	// store setted below
});

const configure = _.debounce(function() {
	const config = {
		clientId: RocketChat.settings.get('Accounts_OAuth_Google_id'),
		clientSecret: RocketChat.settings.get('Accounts_OAuth_Google_secret'),
		callbackUrl: RocketChat.settings.get('Accounts_OAuth_Google_callback_url'),
		credentials: {
			accessToken: RocketChat.settings.get('FileUpload_GoogleDrive_AccessToken'),
			refreshToken: RocketChat.settings.get('FileUpload_GoogleDrive_RefreshToken')
		}
	};

	if (!config.clientId || !config.clientSecret || !config.callbackUrl || !config.accessToken || !config.refreshToken) {
		return;
	}

	GoogleDriveUploads.store = FileUpload.configureUploadsStore('GoogleDrive', GoogleDriveUploads.name, config);
	GoogleDriveAvatars.store = FileUpload.configureUploadsStore('GoogleDrive', GoogleDriveAvatars.name, config);
	GoogleDriveUserDataFiles.store = FileUpload.configureUploadsStore('GoogleDrive', GoogleDriveUserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
