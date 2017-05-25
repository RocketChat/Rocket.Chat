/* globals FileUpload, FileUploadBase, UploadFS, AmazonS3ServerStore:true, AmazonS3ServerStoreAvatar:true */

import '../../ufs/client.js';

AmazonS3ServerStore = new UploadFS.store.AmazonS3({
	collection: RocketChat.models.Uploads.model,
	name: 'AmazonS3Server:Uploads',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

AmazonS3ServerStoreAvatar = new UploadFS.store.AmazonS3({
	collection: RocketChat.models.Avatars.model,
	name: 'AmazonS3Server:Avatars',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

FileUpload.AmazonS3Server = class FileUploadAmazonS3Server extends FileUploadBase {
	constructor(directive, meta, file) {
		super(meta, file);
		console.log('AmazonS3Server', {directive, meta, file});
		this.store = directive === 'avatar' ? AmazonS3ServerStoreAvatar : AmazonS3ServerStore;
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
