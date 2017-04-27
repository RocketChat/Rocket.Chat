/* globals FileUploadBase, UploadFS, FileUpload:true */
FileUpload.GridFS = class FileUploadGridFS extends FileUploadBase {
	constructor(directive, meta, file) {
		super(meta, file);
		this.store = directive === 'avatar' ? Meteor.fileStoreAvatar : Meteor.fileStore;
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
				Meteor.call('sendFileMessage', this.meta.rid, null, file, () => {
					Meteor.setTimeout(() => {
						return callback(null, file);
					}, 2000);
				});
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
