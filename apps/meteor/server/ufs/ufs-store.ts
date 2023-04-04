/* eslint-disable complexity */

import fs from 'fs';
import type stream from 'stream';
import type * as http from 'http';

import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type createServer from 'connect';
import type { OptionalId } from 'mongodb';
import type { IUpload } from '@rocket.chat/core-typings';
import type { IBaseUploadsModel } from '@rocket.chat/model-typings';

import { UploadFS } from '.';
import type { IFile } from './definition';
import { Filter } from './ufs-filter';
import { Tokens } from './ufs-tokens';

export type StoreOptions = {
	collection?: IBaseUploadsModel<IFile>;
	filter?: Filter;
	name: string;
	onCopyError?: (err: any, fileId: string, file: IFile) => void;
	onFinishUpload?: (file: IFile) => Promise<void>;
	onRead?: (fileId: string, file: IFile, request: any, response: any) => Promise<boolean>;
	onReadError?: (err: any, fileId: string, file: IFile) => void;
	onValidate?: (file: IFile) => Promise<void>;
	onWriteError?: (err: any, fileId: string, file: IFile) => void;
	transformRead?: (
		readStream: stream.Readable,
		writeStream: stream.Writable,
		fileId: string,
		file: IFile,
		request: createServer.IncomingMessage,
		headers?: Record<string, any>,
	) => void;
	transformWrite?: (readStream: stream.Readable, writeStream: stream.Writable, fileId: string, file: IFile) => void;
};

export class Store {
	protected options: StoreOptions;

	public checkToken: (token: string, fileId: string) => boolean;

	public copy: (
		fileId: string,
		store: Store,
		callback?: (err?: Error, copyId?: string, copy?: OptionalId<IFile>, store?: Store) => void,
	) => Promise<void>;

	public create: (file: OptionalId<IFile>) => Promise<string>;

	public createToken: (fileId: string) => void;

	public write: (rs: stream.Readable, fileId: string, callback: (err?: Error, file?: IFile) => void) => Promise<void>;

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

		if (options.onCopyError) this.onCopyError = options.onCopyError;
		if (options.onFinishUpload) this.onFinishUpload = options.onFinishUpload;
		if (options.onRead) this.onRead = options.onRead;
		if (options.onReadError) this.onReadError = options.onReadError;
		if (options.onWriteError) this.onWriteError = options.onWriteError;
		if (options.onValidate) this.onValidate = options.onValidate;

		// Add the store to the list
		UploadFS.addStore(this);

		this.checkToken = (token, fileId) => {
			check(token, String);
			check(fileId, String);
			return Tokens.find({ value: token, fileId }).count() === 1;
		};

		this.copy = async (fileId, store, callback) => {
			check(fileId, String);

			if (!(store instanceof Store)) {
				throw new TypeError('store is not an instance of UploadFS.Store');
			}
			// Get original file
			const file = await this.getCollection().findOne({ _id: fileId });
			if (!file) {
				throw new Meteor.Error('file-not-found', 'File not found');
			}
			// Silently ignore the file if it does not match filter
			const filter = store.getFilter();
			if (filter instanceof Filter && !(await filter.isValid(file))) {
				return;
			}

			// Prepare copy
			const { _id, url, ...copy } = file;
			copy.originalStore = this.getName();
			copy.originalId = fileId;

			// Create the copy
			const copyId = await store.create(copy);

			// Get original stream
			const rs = await this.getReadStream(fileId, file);

			// Catch errors to avoid app crashing
			rs.on(
				'error',
				Meteor.bindEnvironment((err: Error) => {
					callback?.call(this, err);
				}),
			);

			// Copy file data
			await store.write(
				rs,
				copyId,
				Meteor.bindEnvironment((err) => {
					if (err) {
						void this.removeById(copyId);
						this.onCopyError.call(this, err, fileId, file);
					}
					if (typeof callback === 'function') {
						callback.call(this, err, copyId, copy, store);
					}
				}),
			);
		};

		this.create = async (file) => {
			check(file, Object);
			file.store = this.options.name; // assign store to file
			return (await this.getCollection().insertOne(file)).insertedId;
		};

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

		this.write = async (rs, fileId, callback) => {
			const file = await this.getCollection().findOne({ _id: fileId });
			if (!file) {
				return callback(new Error('File not found'));
			}

			const errorHandler = Meteor.bindEnvironment((err: Error) => {
				this.onWriteError.call(this, err, fileId, file);
				callback.call(this, err);
			});

			const finishHandler = Meteor.bindEnvironment(async () => {
				let size = 0;
				const readStream = await this.getReadStream(fileId, file);

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
					Meteor.bindEnvironment(async () => {
						if (file.complete) {
							return;
						}
						// Set file attribute
						file.complete = true;
						file.etag = UploadFS.generateEtag();
						file.path = await this.getFileRelativeURL(fileId);
						file.progress = 1;
						file.size = size;
						file.token = this.generateToken();
						file.uploading = false;
						file.uploadedAt = new Date();
						file.url = await this.getFileURL(fileId);

						// Execute callback
						if (typeof this.onFinishUpload === 'function') {
							await this.onFinishUpload.call(this, file);
						}

						// Sets the file URL when file transfer is complete,
						// this way, the image will loads entirely.
						await this.getCollection().updateOne(
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
					}),
				);
			});

			const ws = await this.getWriteStream(fileId, file);
			ws.on('error', errorHandler);
			ws.once('finish', finishHandler);

			// Execute transformation
			this.transformWrite(rs, ws, fileId, file);
		};
	}

	async removeById(fileId: string) {
		// Delete the physical file in the store
		await this.delete(fileId);

		const tmpFile = UploadFS.getTempFilePath(fileId);

		// Delete the temp file
		fs.stat(tmpFile, (err) => {
			!err &&
				fs.unlink(tmpFile, (err2) => {
					err2 && console.error(`ufs: cannot delete temp file at ${tmpFile} (${err2.message})`);
				});
		});

		await this.getCollection().removeById(fileId);
		Tokens.remove({ fileId });
	}

	async delete(_fileId: string): Promise<any> {
		throw new Error('delete is not implemented');
	}

	generateToken(pattern?: string) {
		return (pattern || 'xyxyxyxyxy').replace(/[xy]/g, (c) => {
			// eslint-disable-next-line no-mixed-operators
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			const s = v.toString(16);
			return Math.round(Math.random()) ? s.toUpperCase() : s;
		});
	}

	getCollection() {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.options.collection!;
	}

	async getFilePath(_fileId: string, _file?: IFile): Promise<string> {
		throw new Error('Store.getFilePath is not implemented');
	}

	async getFileRelativeURL(fileId: string) {
		const file = await this.getCollection().findOne(fileId, { projection: { name: 1 } });
		return file ? this.getRelativeURL(`${fileId}/${file.name}`) : undefined;
	}

	async getFileURL(fileId: string) {
		const file = await this.getCollection().findOne(fileId, { projection: { name: 1 } });
		return file ? this.getURL(`${fileId}/${file.name}`) : undefined;
	}

	getFilter() {
		return this.options.filter;
	}

	getName() {
		return this.options.name;
	}

	async getReadStream(_fileId: string, _file: IFile, _options?: { start?: number; end?: number }): Promise<stream.Readable> {
		throw new Error('Store.getReadStream is not implemented');
	}

	getRelativeURL(path: string) {
		const rootUrl = Meteor.absoluteUrl().replace(/\/+$/, '');
		const rootPath = rootUrl.replace(/^[a-z]+:\/\/[^/]+\/*/gi, '');
		const storeName = this.getName();
		path = String(path).replace(/\/$/, '').trim();
		return encodeURI(`${rootPath}/${UploadFS.config.storesPath}/${storeName}/${path}`);
	}

	getURL(path: string) {
		const rootUrl = Meteor.absoluteUrl('', { secure: UploadFS.config.https }).replace(/\/+$/, '');
		const storeName = this.getName();
		path = String(path).replace(/\/$/, '').trim();
		return encodeURI(`${rootUrl}/${UploadFS.config.storesPath}/${storeName}/${path}`);
	}

	async getRedirectURL(_file: IUpload, _forceDownload = false): Promise<string> {
		throw new Error('getRedirectURL is not implemented');
	}

	async getWriteStream(_fileId: string, _file: IFile): Promise<stream.Writable> {
		throw new Error('getWriteStream is not implemented');
	}

	onCopyError(err: Error, fileId: string, _file: IFile) {
		console.error(`ufs: cannot copy file "${fileId}" (${err.message})`, err);
	}

	async onFinishUpload(_file: IFile) {
		//
	}

	async onRead(_fileId: string, _file: IFile, _request: createServer.IncomingMessage, _response: http.ServerResponse) {
		return true;
	}

	onReadError(err: Error, fileId: string, _file: IFile) {
		console.error(`ufs: cannot read file "${fileId}" (${err.message})`, err);
	}

	async onValidate(_file: IFile) {
		//
	}

	onWriteError(err: Error, fileId: string, _file: IFile) {
		console.error(`ufs: cannot write file "${fileId}" (${err.message})`, err);
	}

	transformRead(
		readStream: stream.Readable,
		writeStream: stream.Writable,
		fileId: string,
		file: IFile,
		request: createServer.IncomingMessage,
		headers?: Record<string, any>,
	) {
		if (typeof this.options.transformRead === 'function') {
			this.options.transformRead.call(this, readStream, writeStream, fileId, file, request, headers);
		} else {
			readStream.pipe(writeStream);
		}
	}

	transformWrite(readStream: stream.Readable, writeStream: stream.Writable, fileId: string, file: IFile) {
		if (typeof this.options.transformWrite === 'function') {
			this.options.transformWrite.call(this, readStream, writeStream, fileId, file);
		} else {
			readStream.pipe(writeStream);
		}
	}

	async validate(file: IFile) {
		if (typeof this.onValidate === 'function') {
			await this.onValidate(file);
		}
	}
}
