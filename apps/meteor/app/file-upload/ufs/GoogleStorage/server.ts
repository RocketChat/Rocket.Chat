import { check } from 'meteor/check';
import { Random } from '@rocket.chat/random';
import type { GetSignedUrlConfig } from '@google-cloud/storage';
import { Storage } from '@google-cloud/storage';
import type { OptionalId } from 'mongodb';

import { UploadFS } from '../../../../server/ufs';
import { SystemLogger } from '../../../../server/lib/logger/system';
import type { StoreOptions } from '../../../../server/ufs/ufs-store';
import type { IFile } from '../../../../server/ufs/definition';

type GStoreOptions = StoreOptions & {
	connection: {
		credentials: {
			client_email: string;
			private_key: string;
			projectId: string;
		};
	};
	bucket: string;
	URLExpiryTimeSpan: number;
	getPath: (file: OptionalId<IFile>) => string;
};

class GoogleStorageStore extends UploadFS.Store {
	protected getPath: (file: IFile) => string;

	constructor(options: GStoreOptions) {
		super(options);

		const gcs = new Storage(options.connection);
		const bucket = gcs.bucket(options.bucket);

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

			return file._id;
		};

		this.getRedirectURL = async (file, forceDownload = false) => {
			const params: GetSignedUrlConfig = {
				action: 'read',
				responseDisposition: forceDownload ? 'attachment' : 'inline',
				expires: Date.now() + options.URLExpiryTimeSpan * 1000,
			};

			const res = await bucket.file(this.getPath(file)).getSignedUrl(params);
			return res[0];
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
				path: options.getPath(file),
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
			if (!file) {
				callback?.(new Error('File not found'));
				return;
			}
			bucket.file(this.getPath(file)).delete(function (err, data) {
				if (err) {
					SystemLogger.error(err);
				}

				callback?.(err || undefined, data);
			});
		};

		/**
		 * Returns the file read stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getReadStream = function (_fileId, file, options = {}) {
			const config: {
				start?: number;
				end?: number;
			} = {};

			if (options.start != null) {
				config.start = options.start;
			}

			if (options.end != null) {
				config.end = options.end;
			}

			return bucket.file(this.getPath(file)).createReadStream(config);
		};

		/**
		 * Returns the file write stream
		 * @param fileId
		 * @param file
		 * @param options
		 * @return {*}
		 */
		this.getWriteStream = function (_fileId, file /* , options*/) {
			return bucket.file(this.getPath(file)).createWriteStream({
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
