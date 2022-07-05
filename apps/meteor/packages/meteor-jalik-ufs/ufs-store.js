/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Karl STEIN
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { _ } from 'meteor/underscore';

import { UploadFS } from './ufs';
import { Filter } from './ufs-filter';
import { StorePermissions } from './ufs-store-permissions';
import { Tokens } from './ufs-tokens';

/**
 * File store
 */
export class Store {
	constructor(options) {
		const self = this;

		// Default options
		options = _.extend(
			{
				collection: null,
				filter: null,
				name: null,
				onCopyError: this.onCopyError,
				onFinishUpload: this.onFinishUpload,
				onRead: this.onRead,
				onReadError: this.onReadError,
				onValidate: this.onValidate,
				onWriteError: this.onWriteError,
				permissions: null,
				transformRead: null,
				transformWrite: null,
			},
			options,
		);

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
		self.options = options;
		self.permissions = options.permissions;
		['onCopyError', 'onFinishUpload', 'onRead', 'onReadError', 'onWriteError', 'onValidate'].forEach((method) => {
			if (typeof options[method] === 'function') {
				self[method] = options[method];
			}
		});

		// Add the store to the list
		UploadFS.addStore(self);

		// Set default permissions
		if (!(self.permissions instanceof StorePermissions)) {
			// Uses custom default permissions or UFS default permissions
			if (UploadFS.config.defaultStorePermissions instanceof StorePermissions) {
				self.permissions = UploadFS.config.defaultStorePermissions;
			} else {
				self.permissions = new StorePermissions();
				console.warn(`ufs: permissions are not defined for store "${options.name}"`);
			}
		}

		if (Meteor.isServer) {
			/**
			 * Checks token validity
			 * @param token
			 * @param fileId
			 * @returns {boolean}
			 */
			self.checkToken = function (token, fileId) {
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
			self.copy = function (fileId, store, callback) {
				check(fileId, String);

				if (!(store instanceof Store)) {
					throw new TypeError('store is not an instance of UploadFS.Store');
				}
				// Get original file
				const file = self.getCollection().findOne({ _id: fileId });
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
				copy.originalStore = self.getName();
				copy.originalId = fileId;

				// Create the copy
				const copyId = store.create(copy);

				// Get original stream
				const rs = self.getReadStream(fileId, file);

				// Catch errors to avoid app crashing
				rs.on(
					'error',
					Meteor.bindEnvironment(function (err) {
						callback.call(self, err, null);
					}),
				);

				// Copy file data
				store.write(
					rs,
					copyId,
					Meteor.bindEnvironment(function (err) {
						if (err) {
							self.getCollection().remove({ _id: copyId });
							self.onCopyError.call(self, err, fileId, file);
						}
						if (typeof callback === 'function') {
							callback.call(self, err, copyId, copy, store);
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
			self.create = function (file, callback) {
				check(file, Object);
				file.store = self.options.name; // assign store to file
				return self.getCollection().insert(file, callback);
			};

			/**
			 * Creates a token for the file (only needed for client side upload)
			 * @param fileId
			 * @returns {*}
			 */
			self.createToken = function (fileId) {
				const token = self.generateToken();

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
			self.write = function (rs, fileId, callback) {
				const file = self.getCollection().findOne({ _id: fileId });

				const errorHandler = Meteor.bindEnvironment(function (err) {
					self.onWriteError.call(self, err, fileId, file);
					callback.call(self, err);
				});

				const finishHandler = Meteor.bindEnvironment(function () {
					let size = 0;
					const readStream = self.getReadStream(fileId, file);

					readStream.on(
						'error',
						Meteor.bindEnvironment(function (error) {
							callback.call(self, error, null);
						}),
					);
					readStream.on(
						'data',
						Meteor.bindEnvironment(function (data) {
							size += data.length;
						}),
					);
					readStream.on(
						'end',
						Meteor.bindEnvironment(function () {
							if (file.complete) {
								return;
							}
							// Set file attribute
							file.complete = true;
							file.etag = UploadFS.generateEtag();
							file.path = self.getFileRelativeURL(fileId);
							file.progress = 1;
							file.size = size;
							file.token = self.generateToken();
							file.uploading = false;
							file.uploadedAt = new Date();
							file.url = self.getFileURL(fileId);

							// Execute callback
							if (typeof self.onFinishUpload === 'function') {
								self.onFinishUpload.call(self, file);
							}

							// Sets the file URL when file transfer is complete,
							// this way, the image will loads entirely.
							self.getCollection().direct.update(
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
							callback.call(self, null, file);

							// Simulate write speed
							if (UploadFS.config.simulateWriteDelay) {
								Meteor._sleepForMs(UploadFS.config.simulateWriteDelay);
							}

							// Copy file to other stores
							if (self.options.copyTo instanceof Array) {
								for (let i = 0; i < self.options.copyTo.length; i += 1) {
									const store = self.options.copyTo[i];

									if (!store.getFilter() || store.getFilter().isValid(file)) {
										self.copy(fileId, store);
									}
								}
							}
						}),
					);
				});

				const ws = self.getWriteStream(fileId, file);
				ws.on('error', errorHandler);
				ws.once('finish', finishHandler);

				// Execute transformation
				self.transformWrite(rs, ws, fileId, file);
			};
		}

		if (Meteor.isServer) {
			// eslint-disable-next-line no-undef
			const fs = Npm.require('fs');
			const collection = self.getCollection();

			// Code executed after removing file
			collection.after.remove(function (userId, file) {
				// Remove associated tokens
				Tokens.remove({ fileId: file._id });

				if (self.options.copyTo instanceof Array) {
					for (let i = 0; i < self.options.copyTo.length; i += 1) {
						// Remove copies in stores
						self.options.copyTo[i].getCollection().remove({ originalId: file._id });
					}
				}
			});

			// Code executed before inserting file
			collection.before.insert(function (userId, file) {
				if (!self.permissions.checkInsert(userId, file)) {
					throw new Meteor.Error('forbidden', 'Forbidden');
				}
			});

			// Code executed before updating file
			collection.before.update(function (userId, file, fields, modifiers) {
				if (!self.permissions.checkUpdate(userId, file, fields, modifiers)) {
					throw new Meteor.Error('forbidden', 'Forbidden');
				}
			});

			// Code executed before removing file
			collection.before.remove(function (userId, file) {
				if (!self.permissions.checkRemove(userId, file)) {
					throw new Meteor.Error('forbidden', 'Forbidden');
				}

				// Delete the physical file in the store
				self.delete(file._id);

				const tmpFile = UploadFS.getTempFilePath(file._id);

				// Delete the temp file
				fs.stat(tmpFile, function (err) {
					!err &&
						fs.unlink(tmpFile, function (err) {
							err && console.error(`ufs: cannot delete temp file at ${tmpFile} (${err.message})`);
						});
				});
			});
		}
	}

	/**
	 * Deletes a file async
	 * @param fileId
	 * @param callback
	 */
	// eslint-disable-next-line no-unused-vars
	delete(fileId, callback) {
		throw new Error('delete is not implemented');
	}

	/**
	 * Generates a random token
	 * @param pattern
	 * @return {string}
	 */
	generateToken(pattern) {
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
		return this.options.collection;
	}

	/**
	 * Returns the file URL
	 * @param fileId
	 * @return {string|null}
	 */
	getFileRelativeURL(fileId) {
		const file = this.getCollection().findOne(fileId, { fields: { name: 1 } });
		return file ? this.getRelativeURL(`${fileId}/${file.name}`) : null;
	}

	/**
	 * Returns the file URL
	 * @param fileId
	 * @return {string|null}
	 */
	getFileURL(fileId) {
		const file = this.getCollection().findOne(fileId, { fields: { name: 1 } });
		return file ? this.getURL(`${fileId}/${file.name}`) : null;
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
	// eslint-disable-next-line no-unused-vars
	getReadStream(fileId, file) {
		throw new Error('Store.getReadStream is not implemented');
	}

	/**
	 * Returns the store relative URL
	 * @param path
	 * @return {string}
	 */
	getRelativeURL(path) {
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
	getURL(path) {
		const rootUrl = Meteor.absoluteUrl({ secure: UploadFS.config.https }).replace(/\/+$/, '');
		const storeName = this.getName();
		path = String(path).replace(/\/$/, '').trim();
		return encodeURI(`${rootUrl}/${UploadFS.config.storesPath}/${storeName}/${path}`);
	}

	/**
	 * Returns the file write stream
	 * @param fileId
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	getWriteStream(fileId, file) {
		throw new Error('getWriteStream is not implemented');
	}

	/**
	 * Completes the file upload
	 * @param url
	 * @param file
	 * @param callback
	 */
	importFromURL(url, file, callback) {
		Meteor.call('ufsImportURL', url, file, this.getName(), callback);
	}

	/**
	 * Called when a copy error happened
	 * @param err
	 * @param fileId
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onCopyError(err, fileId, file) {
		console.error(`ufs: cannot copy file "${fileId}" (${err.message})`, err);
	}

	/**
	 * Called when a file has been uploaded
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onFinishUpload(file) {}

	/**
	 * Called when a file is read from the store
	 * @param fileId
	 * @param file
	 * @param request
	 * @param response
	 * @return boolean
	 */
	// eslint-disable-next-line no-unused-vars
	onRead(fileId, file, request, response) {
		return true;
	}

	/**
	 * Called when a read error happened
	 * @param err
	 * @param fileId
	 * @param file
	 * @return boolean
	 */
	// eslint-disable-next-line no-unused-vars
	onReadError(err, fileId, file) {
		console.error(`ufs: cannot read file "${fileId}" (${err.message})`, err);
	}

	/**
	 * Called when file is being validated
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onValidate(file) {}

	/**
	 * Called when a write error happened
	 * @param err
	 * @param fileId
	 * @param file
	 * @return boolean
	 */
	// eslint-disable-next-line no-unused-vars
	onWriteError(err, fileId, file) {
		console.error(`ufs: cannot write file "${fileId}" (${err.message})`, err);
	}

	/**
	 * Sets the store permissions
	 * @param permissions
	 */
	setPermissions(permissions) {
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
	transformRead(readStream, writeStream, fileId, file, request, headers) {
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
	transformWrite(readStream, writeStream, fileId, file) {
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
	validate(file) {
		if (typeof this.onValidate === 'function') {
			this.onValidate(file);
		}
	}
}
