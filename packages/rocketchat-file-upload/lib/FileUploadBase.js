/* globals FileUploadBase:true, UploadFS */
/* exported FileUploadBase */

UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
	insert(userId, doc) {
		return userId || (doc && doc.message_id && doc.message_id.indexOf('slack-') === 0); // allow inserts from slackbridge (message_id = slack-timestamp-milli)
	},
	update(userId, doc) {
		return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || (RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId);
	},
	remove(userId, doc) {
		return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || (RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId);
	}
});


FileUploadBase = class FileUploadBase {
	constructor(store, meta, file) {
		this.id = Random.id();
		this.meta = meta;
		this.file = file;
		this.store = store;
	}

	getProgress() {

	}

	getFileName() {
		return this.meta.name;
	}

	start(callback) {
		console.log("File upload attempt:");
		console.log(this);
		var self = this;
		if (this.meta.rid && RocketChat.E2E.getInstanceByRoomId(this.meta.rid) && RocketChat.E2E.getInstanceByRoomId(this.meta.rid).established.get()) {
			console.log('Will encrypt this message');
			var reader = new FileReader();
			reader.onload = function (evt) {
				console.log("read successful");
		        console.log(evt.target.result);
		        RocketChat.E2E.getInstanceByRoomId(self.meta.rid).encryptFile(evt.target.result)
				.then((msg) => {
					console.log("encryption complete:");
					console.log(msg);
					var encryptedFile = new File([msg], self.file.name);
					console.log(encryptedFile);
					encryptedFile.encryption = true;
					self.handler = new UploadFS.Uploader({
						store: self.store,
						data: encryptedFile,
						file: self.meta,
						onError: (err) => {
							return callback(err);
						},
						onComplete: (fileData) => {
							const file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify', 'description');
							file.encryption = true;
							file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');
							return callback(null, file, self.store.options.name);
						}
					});
					self.handler.onProgress = (file, progress) => {
						self.onProgress(progress);
					};
					return self.handler.start();
				});
		    }
		    reader.onerror = function (evt) {
				console.log("read failure");
		    }
			reader.readAsArrayBuffer(this.file);
		} else {
			console.log('Encryption not required.');
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
					return callback(null, file, this.store.options.name);
				}
			});

			this.handler.onProgress = (file, progress) => {
				this.onProgress(progress);
			};

			return this.handler.start();
		}
		
	}

	onProgress() {}

	stop() {
		return this.handler.stop();
	}
};
