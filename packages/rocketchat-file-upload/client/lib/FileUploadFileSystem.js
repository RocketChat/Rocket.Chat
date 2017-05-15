/* globals FileUploadBase, UploadFS, FileUpload:true, FileSystemStore:true */

FileSystemStore = new UploadFS.store.Local({
	collection: RocketChat.models.Uploads.model,
	name: 'fileSystem',
	filter: new UploadFS.Filter({
		onCheck: FileUpload.validateFileUpload
	})
});

FileUpload.FileSystem = class FileUploadFileSystem extends FileUploadBase {
	constructor(meta, file) {
		super(meta, file);
		this.handler = new UploadFS.Uploader({
			store: FileSystemStore,
			data: file,
			file: meta,
			onError: (err) => {
				const uploading = Session.get('uploading');
				if (uploading != null) {
					const item = _.findWhere(uploading, {
						id: this.id
					});
					if (item != null) {
						item.error = err.reason;
						item.percentage = 0;
					}
					return Session.set('uploading', uploading);
				}
			},
			onComplete: (fileData) => {
				const file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify', 'description');

				file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');

				Meteor.call('sendFileMessage', this.meta.rid, null, file, () => {
					Meteor.setTimeout(() => {
						const uploading = Session.get('uploading');
						if (uploading != null) {
							const item = _.findWhere(uploading, {
								id: this.id
							});
							return Session.set('uploading', _.without(uploading, item));
						}
					}, 2000);
				});
			}
		});

		this.handler.onProgress = (file, progress) => {
			this.onProgress(progress);
		};
	}

	start() {
		return this.handler.start();
	}

	onProgress() {}

	stop() {
		return this.handler.stop();
	}
};
