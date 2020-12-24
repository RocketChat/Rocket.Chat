import { check } from 'meteor/check';
import { UploadFS } from 'meteor/jalik:ufs';
import { Random } from 'meteor/random';
import uplink from 'uplink-js';

/**
 * Storj store
 * @param options
 * @constructor
 */

export class StorjStore extends UploadFS.Store {
	constructor(options) {
		// Default options
		// options.accessKey,
		// options.bucketName,
		super(options);

		options.getPath = options.getPath || function(file) {
			return file._id;
		};

		this.bucketName = options.bucketName;
		uplink.parseAccess(options.accessKey).then((access) => access.openProject()).then((project) => {
			this.project = project;
		});

		this.getPath = function(file) {
			if (file.Storj) {
				return file.Storj.path;
			}
		};

		/**
		 * Creates the file in the collection
		 * @param file
		 * @param callback
		 * @return {string}
		 */
		this.create = function(file, callback) {
			check(file, Object);

			if (file._id == null) {
				file._id = Random.id();
			}

			file.Storj = {
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
		this.delete = function(fileId, callback) {
			this.project.deleteObject(this.bucketName, fileId).then(() => {
				callback && callback();
			});
		};

		/**
		 * Returns the file read stream
		 * @param fileId
		 * @return {*}
		 */
		this.getReadStreamAsync = async function(fileId) {
			try {
				const download = await this.project.downloadObject(this.bucketName, fileId);
				return download.stream();
			} catch (e) {
				return undefined;
			}
		};

		/**
		 * Returns the file read stream
		 * @param fileId
		 * @return {*}
		 */
		this.getReadStream = function(fileId) {
			return Promise.await(this.getReadStreamAsync(fileId));
		};

		/**
		 * Returns the file write stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getWriteStream = function(fileId/* , file, options*/) {
			const upload = Promise.await(this.project.uploadObject(this.bucketName, fileId));
			return upload.stream();
		};
	}
}

// Add store to UFS namespace
UploadFS.store.Storj = StorjStore;
