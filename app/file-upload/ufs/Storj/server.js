import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { UploadFS } from 'meteor/jalik:ufs';
import { Random } from 'meteor/random';
// import uplink from 'uplink-js';

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
		// uplink.parseAccess(options.accessKey).then((access) => access.openProject()).then((project) => {
		// 	this.project = project;
		// });

		this.getPath = function(file) {
			if (file.Storj) {
				return file.Storj.path;
			}
		};

		this.getRedirectURL = function(file, forceDownload = false, callback) {
			// const download = this.project.downloadObject(this.bucketName, encodeURI(file.name));


			// const params = {
			// 	action: 'read',
			// 	responseDisposition: forceDownload ? 'attachment' : 'inline',
			// 	expires: Date.now() + this.options.URLExpiryTimeSpan * 1000,
			// };

			// this.bucket.file(this.getPath(file)).getSignedUrl(params, callback);

			// const params = {
			// 	Key: this.getPath(file),
			// 	Expires: classOptions.URLExpiryTimeSpan,
			// 	ResponseContentDisposition: `${ forceDownload ? 'attachment' : 'inline' }; filename="${ encodeURI(file.name) }"`,
			// };

			// return s3.getSignedUrl('getObject', params, callback);
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
			// const file = this.getCollection().findOne({ _id: fileId });

			// this.project.deleteObject(this.bucketName, fileId).then((...args) => {
			// 	console.log('deleteObject', ...args);
			// 	callback && callback();
			// });
		};

		/**
		 * Returns the file read stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */

		 this.lateReadStream = async function(fileId, file, options = {}) {
		 	Meteor.wrapAsync((cb) => {
		 		setTimeout(cb, 10000);
		 	})();
		 	console.log('lateReadStream');
			const download = await this.project.downloadObject(this.bucketName, fileId);
			return download;
		};

		this.getReadStream = function(fileId, file, options = {}) {
			console.log('getReadStream', fileId);
			// const download = Promise.await(this.lateReadStream(fileId, file, options));
			const download = Promise.await(this.project.downloadObject(this.bucketName, fileId));
			return download.stream();
		};

		/**
		 * Returns the file write stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getWriteStream = function(fileId, file/* , options*/) {
			console.log('getWriteStream');
			const upload = Promise.await(this.project.uploadObject(this.bucketName, fileId));
			const stream = upload.stream();
			stream.on('finish', () => {
				console.log('finished writing');
			});
			stream.on('close', () => {
				console.log('close');
			});
			stream.on('error', () => {
				console.log('error');
			});
			stream.on('drain', () => {
				console.log('drain');
			});
			stream.on('pipe', () => {
				console.log('pipe');
			});
			stream.on('unpipe', () => {
				console.log('unpipe');
			});
			stream.on('end', () => {
				console.log('end');
			});
			return stream;
		};
	}
}

// Add store to UFS namespace
UploadFS.store.Storj = StorjStore;
