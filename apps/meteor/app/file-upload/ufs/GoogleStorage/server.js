import { check } from 'meteor/check';
import { UploadFS } from 'meteor/jalik:ufs';
import { Random } from 'meteor/random';
import { Storage } from '@google-cloud/storage';

import { SystemLogger } from '../../../../server/lib/logger/system';

/**
 * GoogleStorage store
 * @param options
 * @constructor
 */
export class GoogleStorageStore extends UploadFS.Store {
	constructor(options) {
		super(options);

		const gcs = new Storage(options.connection);
		this.bucket = gcs.bucket(options.bucket);

		options.getPath =
			options.getPath ||
			function (file) {
				return file._id;
			};

		this.getPath = function (file) {
			if (file.GoogleStorage) {
				return file.GoogleStorage.path;
			}
			// Compatibility
			// TODO: Migration
			if (file.googleCloudStorage) {
				return file.googleCloudStorage.path + file._id;
			}
		};

		this.getRedirectURL = function (file, forceDownload = false, callback) {
			const params = {
				action: 'read',
				responseDisposition: forceDownload ? 'attachment' : 'inline',
				expires: Date.now() + this.options.URLExpiryTimeSpan * 1000,
			};

			this.bucket.file(this.getPath(file)).getSignedUrl(params, callback);
		};

		/**
		 * Creates the file in the collection
		 * @param file
		 * @param callback
		 * @return {string}
		 */
		this.create = function (file, callback) {
			check(file, Object);

			if (file._id == null) {
				file._id = Random.id();
			}

			file.GoogleStorage = {
				path: this.options.getPath(file),
			};

			file.store = this.options.name; // assign store to file
			return this.getCollection().insert(file, callback);
		};

		/**
		 * Removes the file
		 * @param fileId
		 * @param callback
		 */
		this.delete = function (fileId, callback) {
			const file = this.getCollection().findOne({ _id: fileId });
			this.bucket.file(this.getPath(file)).delete(function (err, data) {
				if (err) {
					SystemLogger.error(err);
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
		this.getReadStream = function (fileId, file, options = {}) {
			const config = {};

			if (options.start != null) {
				config.start = options.start;
			}

			if (options.end != null) {
				config.end = options.end;
			}

			return this.bucket.file(this.getPath(file)).createReadStream(config);
		};

		/**
		 * Returns the file write stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getWriteStream = function (fileId, file /* , options*/) {
			return this.bucket.file(this.getPath(file)).createWriteStream({
				gzip: false,
				metadata: {
					contentType: file.type,
					contentDisposition: `inline; filename=${file.name}`,
					// metadata: {
					// 	custom: 'metadata'
					// }
				},
			});
		};
	}
}

// Add store to UFS namespace
UploadFS.store.GoogleStorage = GoogleStorageStore;
