/* globals FileUploadBase:true, UploadFS */
/* exported FileUploadBase */
import _ from 'underscore';

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
		const self = this;
		if (this.meta.rid && RocketChat.E2E.getInstanceByRoomId(this.meta.rid) && RocketChat.E2E.getInstanceByRoomId(this.meta.rid).established.get()) {
			// Encryption is required as E2E is in session.

			// Read the selected file into an arraybuffer object, encrypt it, then create new file object with that buffer, and upload that object.
			const reader = new FileReader();
			reader.onload = function(evt) {
				RocketChat.E2E.getInstanceByRoomId(self.meta.rid).encryptFile(evt.target.result)
					.then((msg) => {
						// File has been encrypted.
						const encryptedFile = new File([msg], self.file.name);
						encryptedFile.encryption = true;

						// Create upload handler for new file object.
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
			};
			reader.onerror = function(evt) {
				console.log(`read failure${ evt }`);
			};
			reader.readAsArrayBuffer(this.file);
		} else {
			// Encryption is not required as E2E is not in session.
			// Proceed normally.
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
