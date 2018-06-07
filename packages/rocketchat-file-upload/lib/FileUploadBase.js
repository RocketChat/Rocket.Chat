/* globals FileUploadBase:true, UploadFS */
/* exported FileUploadBase */
import _ from 'underscore';

UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
	insert(userId, doc) {
		if (userId) {
			return true;
		}

		// allow inserts from slackbridge (message_id = slack-timestamp-milli)
		if (doc && doc.message_id && doc.message_id.indexOf('slack-') === 0) {
			return true;
		}

		// allow inserts to the UserDataFiles store
		if (doc && doc.store && doc.store.split(':').pop() === 'UserDataFiles') {
			return true;
		}

		return false;
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

	onProgress() {}

	stop() {
		return this.handler.stop();
	}
};
