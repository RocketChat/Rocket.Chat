import {Meteor} from 'meteor/meteor';
import {UploadFS} from 'meteor/jalik:ufs';
import gcStorage from '@google-cloud/storage';

/**
 * GoogleStorage store
 * @param options
 * @constructor
 */
export class GoogleStorageStore extends UploadFS.Store {

	constructor(options) {
		super(options);

		const classOptions = options;

		if (Meteor.isServer) {
			const gcs = gcStorage(options.connection);
			const bucket = gcs.bucket(options.bucket);

			this.getPath = function(file) {
				return `${ RocketChat.hostname }/${ file.rid }/${ file.userId }/${ file._id }`;
			};

			this.getRedirectURL = function(file, callback) {
				const params = {
					action: 'read',
					responseDisposition: 'inline',
					expires: Date.now()+classOptions.URLExpiryTimeSpan*1000
				};

				bucket.file(this.getPath(file)).getSignedUrl(params, callback);
			};

			/**
			 * Removes the file
			 * @param fileId
			 * @param callback
			 */
			this.delete = function(fileId, callback) {
				const file = this.getCollection().findOne({_id: fileId});
				bucket.file(this.getPath(file)).delete(function(err, data) {
					if (err) {
						console.error(err);
					}

					callback && callback(err, data);
				});
			};

			/**
			 * Returns the file read stream
			 * @param fileId
			 * @param file
			 * @param options
			 * @return {*}
			 */
			this.getReadStream = function(fileId, file/*, options = {}*/) {
				// TODO range?
				return bucket.file(this.getPath(file)).createReadStream();
			};

			/**
			 * Returns the file write stream
			 * @param fileId
			 * @param file
			 * @param options
			 * @return {*}
			 */
			this.getWriteStream = function(fileId, file/*, options*/) {
				return bucket.file(this.getPath(file)).createWriteStream({
					gzip: false,
					metadata: {
						contentType: file.type,
						contentDisposition: `inline; filename=${ file.name }`
						// metadata: {
						// 	custom: 'metadata'
						// }
					}
				});
			};
		}
	}
}

// Add store to UFS namespace
UploadFS.store.GoogleStorage = GoogleStorageStore;
