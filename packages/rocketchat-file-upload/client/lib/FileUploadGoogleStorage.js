/* globals FileUpload, FileUploadBase, Slingshot */

FileUpload.GoogleCloudStorage = class FileUploadGoogleCloudStorage extends FileUploadBase {
	constructor(directive, meta, file) {
		super(meta, file);
		const directives = {
			'upload': 'rocketchat-uploads-gs',
			'avatar': 'rocketchat-avatars-gs'
		};
		this.uploader = new Slingshot.Upload(directives[directive], { rid: meta.rid });
	}

	start(callback) {
		this.uploader.send(this.file, (error, downloadUrl) => {
			if (this.computation) {
				this.computation.stop();
			}

			if (error) {
				return callback.call(this, error);
			} else {
				const file = _.pick(this.meta, 'type', 'size', 'name', 'identify', 'description');
				file._id = downloadUrl.substr(downloadUrl.lastIndexOf('/') + 1);
				file.url = downloadUrl;

				return callback(null, file, 'GoogleCloudStorage:Uploads');
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
