/* globals FileUpload, FileUploadBase, Slingshot */
this.FileUpload = {
	validateFileUpload(file) {
		if (file.size > FileUpload.maxFileSize) {
			throw new Meteor.Error('error-file-too-large', 'File is too large');
		}

		if (!FileUpload.fileUploadIsValidContentType(file.type)) {
			throw new Meteor.Error('error-invalid-file-type', 'File type is not accepted');
		}

		return true;
	},

	fileUploadMediaWhiteList() {
		var mediaTypeWhiteList = FileUpload.mediaTypeWhiteList;

		if (!mediaTypeWhiteList || mediaTypeWhiteList === '*') {
			return;
		}
		return _.map(mediaTypeWhiteList.split(','), function(item) {
			return item.trim();
		});
	},

	fileUploadIsValidContentType(type) {
		var list, wildCardGlob, wildcards;
		list = FileUpload.fileUploadMediaWhiteList();
		if (!list || _.contains(list, type)) {
			return true;
		} else {
			wildCardGlob = '/*';
			wildcards = _.filter(list, function(item) {
				return item.indexOf(wildCardGlob) > 0;
			});
			if (_.contains(wildcards, type.replace(/(\/.*)$/, wildCardGlob))) {
				return true;
			}
		}
		return false;
	}
};


/* globals FileUploadBase:true */
/* exported FileUploadBase */

FileUploadBase = class FileUploadBase {
	constructor(meta, file/*, data*/) {
		this.id = Random.id();
		this.meta = meta;
		this.file = file;
	}

	getProgress() {

	}

	getFileName() {
		return this.meta.name;
	}

	start() {

	}

	stop() {

	}
};

/* Amazon S3*/
this.FileUpload.AmazonS3 = class FileUploadAmazonS3 extends FileUploadBase {
	constructor(meta, file, data) {
		super(meta, file, data);
		this.uploader = new Slingshot.Upload('rocketchat-uploads', { rid: meta.rid });
	}
	start() {
		this.uploader.send(this.file, (error, downloadUrl) => {
			var file, item, uploading;

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
	}

	getProgress() {
		return this.uploader.progress();
	}

	stop() {
		if (this.uploader && this.uploader.xhr) {
			this.uploader.xhr.abort();
		}
	}
};

/* FileSystem */
// FileSystemStore = new UploadFS.store.Local({
// 	collection: RocketChat.models.Uploads.model,
// 	name: 'fileSystem',
// 	filter: new UploadFS.Filter({
// 		onCheck: FileUpload.validateFileUpload
// 	})
// });

// FileUpload.FileSystem = class FileUploadFileSystem extends FileUploadBase {
// 	constructor(meta, file, data) {
// 		super(meta, file, data);
// 		this.handler = new UploadFS.Uploader({
// 			store: FileSystemStore,
// 			data: data,
// 			file: meta,
// 			onError: (err) => {
// 				var uploading = Session.get('uploading');
// 				if (uploading != null) {
// 					let item = _.findWhere(uploading, {
// 						id: this.id
// 					});
// 					if (item != null) {
// 						item.error = err.reason;
// 						item.percentage = 0;
// 					}
// 					return Session.set('uploading', uploading);
// 				}
// 			},
// 			onComplete: (fileData) => {
// 				var file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify');

// 				file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');

// 				Meteor.call('sendFileMessage', this.meta.rid, null, file, () => {
// 					Meteor.setTimeout(() => {
// 						var uploading = Session.get('uploading');
// 						if (uploading != null) {
// 							let item = _.findWhere(uploading, {
// 								id: this.id
// 							});
// 							return Session.set('uploading', _.without(uploading, item));
// 						}
// 					}, 2000);
// 				});
// 			}
// 		});
// 	}
// 	start() {
// 		return this.handler.start();
// 	}

// 	getProgress() {
// 		return this.handler.getProgress();
// 	}

// 	stop() {
// 		return this.handler.stop();
// 	}
// };

// /* GridFs */
// FileUpload.GridFS = class FileUploadGridFS extends FileUploadBase {
// 	constructor(meta, file, data) {
// 		super(meta, file, data);
// 		this.handler = new UploadFS.Uploader({
// 			store: Meteor.fileStore,
// 			data: data,
// 			file: meta,
// 			onError: (err) => {
// 				var uploading = Session.get('uploading');
// 				if (uploading != null) {
// 					let item = _.findWhere(uploading, {
// 						id: this.id
// 					});
// 					if (item != null) {
// 						item.error = err.reason;
// 						item.percentage = 0;
// 					}
// 					return Session.set('uploading', uploading);
// 				}
// 			},
// 			onComplete: (fileData) => {
// 				var file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify');

// 				file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');

// 				Meteor.call('sendFileMessage', this.meta.rid, null, file, () => {
// 					Meteor.setTimeout(() => {
// 						var uploading = Session.get('uploading');
// 						if (uploading != null) {
// 							let item = _.findWhere(uploading, {
// 								id: this.id
// 							});
// 							return Session.set('uploading', _.without(uploading, item));
// 						}
// 					}, 2000);
// 				});
// 			}
// 		});
// 	}
// 	start() {
// 		return this.handler.start();
// 	}

// 	getProgress() {
// 		return this.handler.getProgress();
// 	}

// 	stop() {
// 		return this.handler.stop();
// 	}
// };

