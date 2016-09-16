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
				var uploading = Session.get('uploading');
				if (uploading != null) {
					let item = _.findWhere(uploading, {
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
				var file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify');

				file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');

				Meteor.call('sendFileMessage', this.meta.rid, null, file, () => {
					Meteor.setTimeout(() => {
						var uploading = Session.get('uploading');
						if (uploading != null) {
							let item = _.findWhere(uploading, {
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
		const uploading = Session.get('uploading') || [];
		const item = {
			id: this.id,
			name: this.getFileName(),
			percentage: 0
		};
		uploading.push(item);
		Session.set('uploading', uploading);
		return this.handler.start();
	}

	onProgress() {}

	stop() {
		return this.handler.stop();
	}
};
