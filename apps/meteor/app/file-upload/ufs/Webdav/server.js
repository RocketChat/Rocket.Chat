import stream from 'stream';

import { check } from 'meteor/check';
import { UploadFS } from 'meteor/jalik:ufs';
import { Random } from 'meteor/random';

import { WebdavClientAdapter } from '../../../webdav/server/lib/webdavClientAdapter';
import { SystemLogger } from '../../../../server/lib/logger/system';
/**
 * WebDAV store
 * @param options
 * @constructor
 */
export class WebdavStore extends UploadFS.Store {
	constructor(options) {
		super(options);
		const { server, username, password } = options.connection.credentials;
		const client = new WebdavClientAdapter(server, { username, password });

		options.getPath = function (file) {
			if (options.uploadFolderPath[options.uploadFolderPath.length - 1] !== '/') {
				options.uploadFolderPath += '/';
			}
			return options.uploadFolderPath + file._id;
		};

		client.stat(options.uploadFolderPath).catch((err) => {
			if (err.message.toLowerCase() === 'not found') {
				client.createDirectory(options.uploadFolderPath);
			} else if (err.message.toLowerCase() === 'unauthorized') {
				console.warn('File upload is unauthorized to connect on Webdav, please verify your credentials');
			}
		});

		/**
		 * Returns the file path
		 * @param file
		 * @return {string}
		 */
		this.getPath = function (file) {
			if (file.Webdav) {
				return file.Webdav.path;
			}
		};

		/**
		 * Creates the file in the col lection
		 * @param file
		 * @param callback
		 * @return {string}
		 */
		this.create = function (file, callback) {
			check(file, Object);

			if (file._id == null) {
				file._id = Random.id();
			}

			file.Webdav = {
				path: options.getPath(file),
			};

			file.store = this.options.name;
			return this.getCollection().insert(file, callback);
		};

		/**
		 * Removes the file
		 * @param fileId
		 * @param callback
		 */
		this.delete = function (fileId, callback) {
			const file = this.getCollection().findOne({ _id: fileId });
			client
				.deleteFile(this.getPath(file))
				.then((data) => {
					callback && callback(null, data);
				})
				.catch(SystemLogger.error);
		};

		/**
		 * Returns the file read stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getReadStream = function (fileId, file, options = {}) {
			const range = {};

			if (options.start != null) {
				range.start = options.start;
			}

			if (options.end != null) {
				range.end = options.end;
			}
			return client.createReadStream(this.getPath(file), options);
		};

		/**
		 * Returns the file write stream
		 * @param fileId
		 * @param file
		 * @return {*}
		 */
		this.getWriteStream = function (fileId, file) {
			const writeStream = new stream.PassThrough();
			const webdavStream = client.createWriteStream(this.getPath(file));

			// TODO remove timeout when UploadFS bug resolved
			const newListenerCallback = (event, listener) => {
				if (event === 'finish') {
					process.nextTick(() => {
						writeStream.removeListener(event, listener);
						writeStream.removeListener('newListener', newListenerCallback);
						writeStream.on(event, function () {
							setTimeout(listener, 500);
						});
					});
				}
			};
			writeStream.on('newListener', newListenerCallback);

			writeStream.pipe(webdavStream);
			return writeStream;
		};
	}
}

// Add store to UFS namespace
UploadFS.store.Webdav = WebdavStore;
