import stream from 'stream';

import { check } from 'meteor/check';
import { Random } from '@rocket.chat/random';
import type { OptionalId } from 'mongodb';

import { UploadFS } from '../../../../server/ufs';
import { WebdavClientAdapter } from '../../../webdav/server/lib/webdavClientAdapter';
import { SystemLogger } from '../../../../server/lib/logger/system';
import type { StoreOptions } from '../../../../server/ufs/ufs-store';
import type { IFile } from '../../../../server/ufs/definition';

type WebdavOptions = StoreOptions & {
	connection: {
		credentials: {
			server: string;
			username: string;
			password: string;
		};
	};
	uploadFolderPath: string;
	getPath: (file: OptionalId<IFile>) => string;
};

class WebdavStore extends UploadFS.Store {
	protected getPath: (file: IFile) => string;

	constructor(options: WebdavOptions) {
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
				void client.createDirectory(options.uploadFolderPath);
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

			return file._id;
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
			if (!file) {
				callback?.(new Error('File no found'));
				return;
			}
			client
				.deleteFile(this.getPath(file))
				.then((data) => {
					callback?.(undefined, data);
				})
				.catch((...args) => SystemLogger.error(...args));
		};

		/**
		 * Returns the file read stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getReadStream = function (_fileId, file, options = {}) {
			const range: {
				start?: number;
				end?: number;
			} = {};

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
		this.getWriteStream = function (_fileId, file) {
			const writeStream = new stream.PassThrough();
			const webdavStream = client.createWriteStream(this.getPath(file), file.size || 0);

			// TODO remove timeout when UploadFS bug resolved
			const newListenerCallback = (event: string, listener: () => any) => {
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
