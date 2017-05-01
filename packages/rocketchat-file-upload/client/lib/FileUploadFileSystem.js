/* globals FileUploadBase, UploadFS, FileUpload:true, FileSystemStore:true, FileSystemStoreAvatar:true */

FileSystemStore = new UploadFS.store.Local({
	collection: RocketChat.models.Uploads.model,
	name: 'fileSystem',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

FileSystemStoreAvatar = new UploadFS.store.Local({
	collection: RocketChat.models.Avatars.model,
	name: 'fileSystemAvatar',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

FileUpload.FileSystem = class FileUploadFileSystem extends FileUploadBase {
	constructor(directive, meta, file) {
		super(meta, file);
		console.log('filesystem', {directive, meta, file});
		this.store = directive === 'avatar' ? FileSystemStoreAvatar : FileSystemStore;
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
