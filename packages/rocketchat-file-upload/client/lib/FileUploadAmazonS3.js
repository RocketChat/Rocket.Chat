/* globals FileUpload, FileUploadBase, Slingshot */

FileUpload.AmazonS3 = class FileUploadAmazonS3 extends FileUploadBase {
	constructor(meta, file) {
		super(meta, file);
		this.uploader = new Slingshot.Upload('rocketchat-uploads', { rid: meta.rid });
	}

	start() {
		this.uploader.send(this.file, (error, downloadUrl) => {
			var file, item, uploading;

			this.computation.stop();

			if (error) {
				uploading = Session.get('uploading');
				if (uploading !== null) {
					item = _.findWhere(uploading, {
						id: this.id
					});
					if (item !== null) {
						item.error = error.error;
						item.percentage = 0;
					}
					Session.set('uploading', uploading);
				}
			} else {
				file = _.pick(this.meta, 'type', 'size', 'name', 'identify');
				file._id = downloadUrl.substr(downloadUrl.lastIndexOf('/') + 1);
				file.url = downloadUrl;

				Meteor.call('sendFileMessage', this.meta.rid, 's3', file, () => {
					Meteor.setTimeout(() => {
						uploading = Session.get('uploading');
						if (uploading !== null) {
							item = _.findWhere(uploading, {
								id: this.id
							});
							return Session.set('uploading', _.without(uploading, item));
						}
					}, 2000);
				});
			}
		});

		this.computation = Tracker.autorun(() => {
			this.onProgress(this.uploader.progress());
		});
	}

	onProgress() {}

	stop() {
		if (this.uploader && this.uploader.xhr) {
			this.uploader.xhr.abort();
		}
	}
};
