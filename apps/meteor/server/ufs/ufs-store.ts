/* eslint-disable complexity */

import fs from 'fs';
import type stream from 'stream';
import type * as http from 'http';

import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import type createServer from 'connect';
import type { OptionalId } from 'mongodb';
import type { IUpload } from '@rocket.chat/core-typings';

import { UploadFS } from '.';
import type { IFile } from './definition';
import { Filter } from './ufs-filter';
import { StorePermissions } from './ufs-store-permissions';
import { Tokens } from './ufs-tokens';

export type StoreOptions = {
	collection?: Mongo.Collection<IFile>;
	copyTo?: Store[];
	filter?: Filter;
	name: string;
	onCopyError?: (err: any, fileId: string, file: IFile) => void;
	onFinishUpload?: (file: IFile) => void;
	onRead?: (fileId: string, file: IFile, request: any, response: any) => boolean;
	onReadError?: (err: any, fileId: string, file: IFile) => void;
	onValidate?: (file: IFile) => void;
	onWriteError?: (err: any, fileId: string, file: IFile) => void;
	permissions?: StorePermissions;
	transformRead?: (
		readStream: stream.Readable,
		writeStream: stream.Writable,
		fileId: string,
		file: IFile,
		request: createServer.IncomingMessage,
		headers: Record<string, any>,
	) => void;
	transformWrite?: (readStream: stream.Readable, writeStream: stream.Writable, fileId: string, file: IFile) => void;
};

export class Store {
	private options: StoreOptions;

	private permissions?: StorePermissions;

	public checkToken: (token: string, fileId: string) => boolean;

	public copy: (
		fileId: string,
		store: Store,
		callback?: (err?: Error, copyId?: string, copy?: OptionalId<IFile>, store?: Store) => void,
	) => void;

	public create: (file: OptionalId<IFile>, callback?: (err?: Error, file?: IFile) => void) => string;

	public createToken: (fileId: string) => void;

	public write: (rs: stream.Readable, fileId: string, callback: (err?: Error, file?: IFile) => void) => void;

	constructor(options: StoreOptions) {
		options = {
			onCopyError: this.onCopyError,
			onFinishUpload: this.onFinishUpload,
			onRead: this.onRead,
			onReadError: this.onReadError,
			onValidate: this.onValidate,
			onWriteError: this.onWriteError,
			...options,
		};

		// Check options
		if (!(options.collection instanceof Mongo.Collection)) {
			throw new TypeError('Store: collection is not a Mongo.Collection');
		}
		if (options.filter && !(options.filter instanceof Filter)) {
			throw new TypeError('Store: filter is not a UploadFS.Filter');
		}
		if (typeof options.name !== 'string') {
			throw new TypeError('Store: name is not a string');
		}
		if (UploadFS.getStore(options.name)) {
			throw new TypeError('Store: name already exists');
		}
		if (options.onCopyError && typeof options.onCopyError !== 'function') {
			throw new TypeError('Store: onCopyError is not a function');
		}
		if (options.onFinishUpload && typeof options.onFinishUpload !== 'function') {
			throw new TypeError('Store: onFinishUpload is not a function');
		}
		if (options.onRead && typeof options.onRead !== 'function') {
			throw new TypeError('Store: onRead is not a function');
		}
		if (options.onReadError && typeof options.onReadError !== 'function') {
			throw new TypeError('Store: onReadError is not a function');
		}
		if (options.onWriteError && typeof options.onWriteError !== 'function') {
			throw new TypeError('Store: onWriteError is not a function');
		}
		if (options.permissions && !(options.permissions instanceof StorePermissions)) {
			throw new TypeError('Store: permissions is not a UploadFS.StorePermissions');
		}
		if (options.transformRead && typeof options.transformRead !== 'function') {
			throw new TypeError('Store: transformRead is not a function');
		}
		if (options.transformWrite && typeof options.transformWrite !== 'function') {
			throw new TypeError('Store: transformWrite is not a function');
		}
		if (options.onValidate && typeof options.onValidate !== 'function') {
			throw new TypeError('Store: onValidate is not a function');
		}

		// Public attributes
		this.options = options;
		this.permissions = options.permissions;

		if (options.onCopyError) this.onCopyError = options.onCopyError;
		if (options.onFinishUpload) this.onFinishUpload = options.onFinishUpload;
		if (options.onRead) this.onRead = options.onRead;
		if (options.onReadError) this.onReadError = options.onReadError;
		if (options.onWriteError) this.onWriteError = options.onWriteError;
		if (options.onValidate) this.onValidate = options.onValidate;

		// Add the store to the list
		UploadFS.addStore(this);

		// Set default permissions
		if (!(this.permissions instanceof StorePermissions)) {
			// Uses custom default permissions or UFS default permissions
			if (UploadFS.config.defaultStorePermissions instanceof StorePermissions) {
				this.permissions = UploadFS.config.defaultStorePermissions;
			} else {
				this.permissions = new StorePermissions();
				console.warn(`ufs: permissions are not defined for store "${options.name}"`);
			}
		}

		/**
		 * Checks token validity
		 * @param token
		 * @param fileId
		 * @returns {boolean}
		 */
		this.checkToken = (token, fileId) => {
			check(token, String);
			check(fileId, String);
			return Tokens.find({ value: token, fileId }).count() === 1;
		};

		/**
		 * Copies the file to a store
		 * @param fileId
		 * @param store
		 * @param callback
		 */
		this.copy = (fileId, store, callback) => {
			check(fileId, String);

			if (!(store instanceof Store)) {
				throw new TypeError('store is not an instance of UploadFS.Store');
			}
			// Get original file
			const file = this.getCollection().findOne({ _id: fileId });
			if (!file) {
				throw new Meteor.Error('file-not-found', 'File not found');
			}
			// Silently ignore the file if it does not match filter
			const filter = store.getFilter();
			if (filter instanceof Filter && !filter.isValid(file)) {
				return;
			}

			// Prepare copy
			const { _id, url, ...copy } = file;
			copy.originalStore = this.getName();
			copy.originalId = fileId;

			// Create the copy
			const copyId = store.create(copy);

			// Get original stream
			const rs = this.getReadStream(fileId, file);

			// Catch errors to avoid app crashing
			rs.on(
				'error',
				Meteor.bindEnvironment((err: Error) => {
					callback?.call(this, err);
				}),
			);

			// Copy file data
			store.write(
				rs,
				copyId,
				Meteor.bindEnvironment((err) => {
					if (err) {
						this.getCollection().remove({ _id: copyId });
						this.onCopyError.call(this, err, fileId, file);
					}
					if (typeof callback === 'function') {
						callback.call(this, err, copyId, copy, store);
					}
				}),
			);
		};

		/**
		 * Creates the file in the collection
		 * @param file
		 * @param callback
		 * @return {string}
		 */
		this.create = (file, callback) => {
			check(file, Object);
			file.store = this.options.name; // assign store to file
			return this.getCollection().insert(file, callback);
		};

		/**
		 * Creates a token for the file (only needed for client side upload)
		 * @param fileId
		 * @returns {*}
		 */
		this.createToken = (fileId) => {
			const token = this.generateToken();

			// Check if token exists
			if (Tokens.find({ fileId }).count()) {
				Tokens.update(
					{ fileId },
					{
						$set: {
							createdAt: new Date(),
							value: token,
						},
					},
				);
			} else {
				Tokens.insert({
					createdAt: new Date(),
					fileId,
					value: token,
				});
			}
			return token;
		};

		/**
		 * Writes the file to the store
		 * @param rs
		 * @param fileId
		 * @param callback
		 */
		this.write = (rs, fileId, callback) => {
			const file = this.getCollection().findOne({ _id: fileId });
			if (!file) {
				return callback(new Error('File not found'));
			}

			const errorHandler = Meteor.bindEnvironment((err: Error) => {
				this.onWriteError.call(this, err, fileId, file);
				callback.call(this, err);
			});

			const finishHandler = Meteor.bindEnvironment(() => {
				let size = 0;
				const readStream = this.getReadStream(fileId, file);

				readStream.on(
					'error',
					Meteor.bindEnvironment((error: Error) => {
						callback.call(this, error);
					}),
				);
				readStream.on(
					'data',
					Meteor.bindEnvironment((data) => {
						size += data.length;
					}),
				);
				readStream.on(
					'end',
					Meteor.bindEnvironment(() => {
						if (file.complete) {
							return;
						}
						// Set file attribute
						file.complete = true;
						file.etag = UploadFS.generateEtag();
						file.path = this.getFileRelativeURL(fileId);
						file.progress = 1;
						file.size = size;
						file.token = this.generateToken();
						file.uploading = false;
						file.uploadedAt = new Date();
						file.url = this.getFileURL(fileId);

						// Execute callback
						if (typeof this.onFinishUpload === 'function') {
							this.onFinishUpload.call(this, file);
						}

						// Sets the file URL when file transfer is complete,
						// this way, the image will loads entirely.
						this.getCollection().direct.update(
							{ _id: fileId },
							{
								$set: {
									complete: file.complete,
									etag: file.etag,
									path: file.path,
									progress: file.progress,
									size: file.size,
									token: file.token,
									uploading: file.uploading,
									uploadedAt: file.uploadedAt,
									url: file.url,
								},
							},
						);

						// Return file info
						callback.call(this, undefined, file);

						// Copy file to other stores
						if (this.options.copyTo instanceof Array) {
							for (let i = 0; i < this.options.copyTo.length; i += 1) {
								const store = this.options.copyTo[i];

								if (!store.getFilter() || store.getFilter()?.isValid(file)) {
									this.copy(fileId, store);
								}
							}
						}
					}),
				);
			});

			const ws = this.getWriteStream(fileId, file);
			ws.on('error', errorHandler);
			ws.once('finish', finishHandler);

			// Execute transformation
			this.transformWrite(rs, ws, fileId, file);
		};

		const collection = this.getCollection();

		// Code executed after removing file
		collection.after.remove((_userId: string, file: IFile) => {
			// Remove associated tokens
			Tokens.remove({ fileId: file._id });

			if (this.options.copyTo instanceof Array) {
				for (let i = 0; i < this.options.copyTo.length; i += 1) {
					// Remove copies in stores
					this.options.copyTo[i].getCollection().remove({ originalId: file._id });
				}
			}
		});

		// Code executed before inserting file
		collection.before.insert((userId: string, file: IFile) => {
			if (!this.permissions?.checkInsert(userId, file)) {
				throw new Meteor.Error('forbidden', 'Forbidden');
			}
		});

		// Code executed before updating file
		collection.before.update((userId: string, file: IFile, fields, modifiers) => {
			if (!this.permissions?.checkUpdate(userId, file, fields, modifiers)) {
				throw new Meteor.Error('forbidden', 'Forbidden');
			}
		});

		// Code executed before removing file
		collection.before.remove((userId: string, file: IFile) => {
			if (!this.permissions?.checkRemove(userId, file)) {
				throw new Meteor.Error('forbidden', 'Forbidden');
			}

			// Delete the physical file in the store
			this.delete(file._id);

			const tmpFile = UploadFS.getTempFilePath(file._id);

			// Delete the temp file
			fs.stat(tmpFile, (err) => {
				!err &&
					fs.unlink(tmpFile, (err2) => {
						err2 && console.error(`ufs: cannot delete temp file at ${tmpFile} (${err2.message})`);
					});
			});
		});
	}

	/**
	 * Deletes a file async
	 * @param fileId
	 * @param callback
	 */
	delete(_fileId: string, _callback?: (err?: Error) => void) {
		throw new Error('delete is not implemented');
	}

	/**
	 * Generates a random token
	 * @param pattern
	 * @return {string}
	 */
	generateToken(pattern?: string) {
		return (pattern || 'xyxyxyxyxy').replace(/[xy]/g, (c) => {
			// eslint-disable-next-line no-mixed-operators
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			const s = v.toString(16);
			return Math.round(Math.random()) ? s.toUpperCase() : s;
		});
	}

	/**
	 * Returns the collection
	 * @return {Mongo.Collection}
	 */
	getCollection() {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.options.collection!;
	}

	/**
	 * Returns the file URL
	 * @param fileId
	 * @return {string|null}
	 */
	getFileRelativeURL(fileId: string) {
		const file = this.getCollection().findOne(fileId, { fields: { name: 1 } });
		return file ? this.getRelativeURL(`${fileId}/${file.name}`) : undefined;
	}

	/**
	 * Returns the file URL
	 * @param fileId
	 * @return {string|null}
	 */
	getFileURL(fileId: string) {
		const file = this.getCollection().findOne(fileId, { fields: { name: 1 } });
		return file ? this.getURL(`${fileId}/${file.name}`) : undefined;
	}

	/**
	 * Returns the file filter
	 * @return {UploadFS.Filter}
	 */
	getFilter() {
		return this.options.filter;
	}

	/**
	 * Returns the store name
	 * @return {string}
	 */
	getName() {
		return this.options.name;
	}

	/**
	 * Returns the file read stream
	 * @param fileId
	 * @param file
	 */
	getReadStream(_fileId: string, _file: IFile, _options?: { start?: number; end?: number }): stream.Readable {
		throw new Error('Store.getReadStream is not implemented');
	}

	/**
	 * Returns the store relative URL
	 * @param path
	 * @return {string}
	 */
	getRelativeURL(path: string) {
		const rootUrl = Meteor.absoluteUrl().replace(/\/+$/, '');
		const rootPath = rootUrl.replace(/^[a-z]+:\/\/[^/]+\/*/gi, '');
		const storeName = this.getName();
		path = String(path).replace(/\/$/, '').trim();
		return encodeURI(`${rootPath}/${UploadFS.config.storesPath}/${storeName}/${path}`);
	}

	/**
	 * Returns the store absolute URL
	 * @param path
	 * @return {string}
	 */
	getURL(path: string) {
		const rootUrl = Meteor.absoluteUrl('', { secure: UploadFS.config.https }).replace(/\/+$/, '');
		const storeName = this.getName();
		path = String(path).replace(/\/$/, '').trim();
		return encodeURI(`${rootUrl}/${UploadFS.config.storesPath}/${storeName}/${path}`);
	}

	getRedirectURL(_file: IUpload, _forceDownload = false, _callback?: (err: Error, url: string) => void) {
		throw new Error('getRedirectURL is not implemented');
	}

	/**
	 * Returns the file write stream
	 * @param fileId
	 * @param file
	 */
	getWriteStream(_fileId: string, _file: IFile): stream.Writable {
		throw new Error('getWriteStream is not implemented');
	}

	/**
	 * Called when a copy error happened
	 * @param err
	 * @param fileId
	 * @param file
	 */
	onCopyError(err: Error, fileId: string, _file: IFile) {
		console.error(`ufs: cannot copy file "${fileId}" (${err.message})`, err);
	}

	/**
	 * Called when a file has been uploaded
	 * @param file
	 */
	onFinishUpload(_file: IFile) {
		//
	}

	/**
	 * Called when a file is read from the store
	 * @param fileId
	 * @param file
	 * @param request
	 * @param response
	 * @return boolean
	 */
	onRead(_fileId: string, _file: IFile, _request: createServer.IncomingMessage, _response: http.ServerResponse) {
		return true;
	}

	/**
	 * Called when a read error happened
	 * @param err
	 * @param fileId
	 * @param file
	 * @return boolean
	 */
	onReadError(err: Error, fileId: string, _file: IFile) {
		console.error(`ufs: cannot read file "${fileId}" (${err.message})`, err);
	}

	/**
	 * Called when file is being validated
	 * @param file
	 */
	onValidate(_file: IFile) {
		//
	}

	/**
	 * Called when a write error happened
	 * @param err
	 * @param fileId
	 * @param file
	 * @return boolean
	 */
	onWriteError(err: Error, fileId: string, _file: IFile) {
		console.error(`ufs: cannot write file "${fileId}" (${err.message})`, err);
	}

	/**
	 * Sets the store permissions
	 * @param permissions
	 */
	setPermissions(permissions: StorePermissions) {
		if (!(permissions instanceof StorePermissions)) {
			throw new TypeError('Permissions is not an instance of UploadFS.StorePermissions');
		}
		this.permissions = permissions;
	}

	/**
	 * Transforms the file on reading
	 * @param readStream
	 * @param writeStream
	 * @param fileId
	 * @param file
	 * @param request
	 * @param headers
	 */
	transformRead(
		readStream: stream.Readable,
		writeStream: stream.Writable,
		fileId: string,
		file: IFile,
		request: createServer.IncomingMessage,
		headers: Record<string, any>,
	) {
		if (typeof this.options.transformRead === 'function') {
			this.options.transformRead.call(this, readStream, writeStream, fileId, file, request, headers);
		} else {
			readStream.pipe(writeStream);
		}
	}

	/**
	 * Transforms the file on writing
	 * @param readStream
	 * @param writeStream
	 * @param fileId
	 * @param file
	 */
	transformWrite(readStream: stream.Readable, writeStream: stream.Writable, fileId: string, file: IFile) {
		if (typeof this.options.transformWrite === 'function') {
			this.options.transformWrite.call(this, readStream, writeStream, fileId, file);
		} else {
			readStream.pipe(writeStream);
		}
	}

	/**
	 * Validates the file
	 * @param file
	 */
	validate(file: IFile) {
		if (typeof this.onValidate === 'function') {
			this.onValidate(file);
		}
	}
}
