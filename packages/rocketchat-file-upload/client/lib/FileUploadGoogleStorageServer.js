/* globals FileUpload, FileUploadBase, UploadFS, GoogleCloudStorageServerStore:true, GoogleCloudStorageServerStoreAvatar:true */

import '../../ufs/GoogleStorage/client.js';

GoogleCloudStorageServerStore = new UploadFS.store.GoogleStorage({
	collection: RocketChat.models.Uploads.model,
	name: 'GoogleCloudStorageServer:Uploads',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

GoogleCloudStorageServerStoreAvatar = new UploadFS.store.GoogleStorage({
	collection: RocketChat.models.Avatars.model,
	name: 'GoogleCloudStorageServer:Avatars',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

FileUpload.GoogleCloudStorageServer = class FileUploadGoogleCloudStorageServer extends FileUploadBase {
	constructor(directive, meta, file) {
		super(meta, file);
		console.log('GoogleCloudStorageServer', {directive, meta, file});
		this.store = directive === 'avatar' ? GoogleCloudStorageServerStoreAvatar : GoogleCloudStorageServerStore;
	}

	start(callback) {
		this.handler = new UploadFS.Uploader({
			store: this.store,
			data: this.file,
			file: this.meta,
			onError: (err) => {
				return callback(err);
			},
			onComplete: (fileData) => {
				const file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify', 'description');

				file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');
				return callback(null, file, 'fs');
			}
		});

		this.handler.onProgress = (file, progress) => {
			this.onProgress(progress);
		};

		return this.handler.start();
	}

	onProgress() {}

	stop() {
		return this.handler.stop();
	}
};
