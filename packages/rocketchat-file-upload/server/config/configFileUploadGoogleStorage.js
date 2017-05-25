/* globals FileUpload, UploadFS, RocketChatFile */

import { FileUploadClass } from '../lib/FileUpload';
import '../../ufs/GoogleStorage/server.js';


const get = function(file, req, res) {
	this.store.getRedirectURL(file, (err, fileUrl) => {
		if (err) {
			console.error(err);
		}

		if (fileUrl) {
			res.setHeader('Location', fileUrl);
			res.writeHead(302);
		}
		res.end();
	});
};

const GoogleCloudStorageUploads = new FileUploadClass({
	name: 'GoogleCloudStorage:Uploads',
	get
	// store setted bellow
});

const GoogleCloudStorageAvatars = new FileUploadClass({
	name: 'GoogleCloudStorage:Avatars',
	get
	// store setted bellow
});

const configure = _.debounce(function() {
	const stores = UploadFS.getStores();
	delete stores[GoogleCloudStorageUploads.name];
	delete stores[GoogleCloudStorageAvatars.name];

	// const type = RocketChat.settings.get('FileUpload_Storage_Type');
	const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
	const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
	const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');

	const config = {
		connection: {
			credentials: {
				client_email: accessId,
				private_key: secret
			}
		},
		bucket,
		URLExpiryTimeSpan
	};

	GoogleCloudStorageUploads.store = new UploadFS.store.GoogleStorage(Object.assign({
		collection: GoogleCloudStorageUploads.model.model,
		filter: new UploadFS.Filter({
			onCheck: FileUpload.validateFileUpload
		}),
		name: GoogleCloudStorageUploads.name,
		onValidate: FileUpload.uploadsOnValidate
	}, config));

	GoogleCloudStorageAvatars.store = new UploadFS.store.GoogleStorage(Object.assign({
		collection: GoogleCloudStorageAvatars.model.model,
		name: GoogleCloudStorageAvatars.name,
		onFinishUpload: FileUpload.avatarsOnFinishUpload,
		onValidate: FileUpload.avatarsOnValidate
	}, config));

}, 500);

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
