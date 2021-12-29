/* eslint-disable no-undef */
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

import { UploadFS } from './ufs';
import { Filter } from './ufs-filter';
import { Tokens } from './ufs-tokens';

const fs = Npm.require('fs');
const http = Npm.require('http');
const https = Npm.require('https');
const Future = Npm.require('fibers/future');

if (Meteor.isServer) {
	Meteor.methods({
		/**
		 * Completes the file transfer
		 * @param fileId
		 * @param storeName
		 * @param token
		 */
		ufsComplete(fileId, storeName, token) {
			check(fileId, String);
			check(storeName, String);
			check(token, String);

			// Get store
			const store = UploadFS.getStore(storeName);
			if (!store) {
				throw new Meteor.Error('invalid-store', 'Store not found');
			}
			// Check token
			if (!store.checkToken(token, fileId)) {
				throw new Meteor.Error('invalid-token', 'Token is not valid');
			}

			const fut = new Future();
			const tmpFile = UploadFS.getTempFilePath(fileId);

			const removeTempFile = function () {
				fs.unlink(tmpFile, function (err) {
					err && console.error(`ufs: cannot delete temp file "${tmpFile}" (${err.message})`);
				});
			};

			try {
				// todo check if temp file exists

				// Get file
				const file = store.getCollection().findOne({ _id: fileId });

				// Validate file before moving to the store
				store.validate(file);

				// Get the temp file
				const rs = fs.createReadStream(tmpFile, {
					flags: 'r',
					encoding: null,
					autoClose: true,
				});

				// Clean upload if error occurs
				rs.on(
					'error',
					Meteor.bindEnvironment(function (err) {
						console.error(err);
						store.getCollection().remove({ _id: fileId });
						fut.throw(err);
					}),
				);

				// Save file in the store
				store.write(
					rs,
					fileId,
					Meteor.bindEnvironment(function (err, file) {
						removeTempFile();

						if (err) {
							fut.throw(err);
						} else {
							// File has been fully uploaded
							// so we don't need to keep the token anymore.
							// Also this ensure that the file cannot be modified with extra chunks later.
							Tokens.remove({ fileId });
							fut.return(file);
						}
					}),
				);

				// catch will not work if fut.wait() is outside try/catch
				return fut.wait();
			} catch (err) {
				// If write failed, remove the file
				store.getCollection().remove({ _id: fileId });
				// removeTempFile(); // todo remove temp file on error or try again ?
				throw new Meteor.Error('ufs: cannot upload file', err);
			}
		},

		/**
		 * Creates the file and returns the file upload token
		 * @param file
		 * @return {{fileId: string, token: *, url: *}}
		 */
		ufsCreate(file) {
			check(file, Object);

			if (typeof file.name !== 'string' || !file.name.length) {
				throw new Meteor.Error('invalid-file-name', 'file name is not valid');
			}
			if (typeof file.store !== 'string' || !file.store.length) {
				throw new Meteor.Error('invalid-store', 'store is not valid');
			}
			// Get store
			const store = UploadFS.getStore(file.store);
			if (!store) {
				throw new Meteor.Error('invalid-store', 'Store not found');
			}

			// Set default info
			file.complete = false;
			file.uploading = false;
			file.extension = file.name && file.name.substr((~-file.name.lastIndexOf('.') >>> 0) + 2).toLowerCase();
			// Assign file MIME type based on the extension
			if (file.extension && !file.type) {
				file.type = UploadFS.getMimeType(file.extension) || 'application/octet-stream';
			}
			file.progress = 0;
			file.size = parseInt(file.size) || 0;
			file.userId = file.userId || this.userId;

			// Check if the file matches store filter
			const filter = store.getFilter();
			if (filter instanceof Filter) {
				filter.check(file);
			}

			// Create the file
			const fileId = store.create(file);
			const token = store.createToken(fileId);
			const uploadUrl = store.getURL(`${fileId}?token=${token}`);

			return {
				fileId,
				token,
				url: uploadUrl,
			};
		},

		/**
		 * Deletes a file
		 * @param fileId
		 * @param storeName
		 * @param token
		 * @returns {*}
		 */
		ufsDelete(fileId, storeName, token) {
			check(fileId, String);
			check(storeName, String);
			check(token, String);

			// Check store
			const store = UploadFS.getStore(storeName);
			if (!store) {
				throw new Meteor.Error('invalid-store', 'Store not found');
			}
			// Ignore files that does not exist
			if (store.getCollection().find({ _id: fileId }).count() === 0) {
				return 1;
			}
			// Check token
			if (!store.checkToken(token, fileId)) {
				throw new Meteor.Error('invalid-token', 'Token is not valid');
			}
			return store.getCollection().remove({ _id: fileId });
		},

		/**
		 * Imports a file from the URL
		 * @param url
		 * @param file
		 * @param storeName
		 * @return {*}
		 */
		ufsImportURL(url, file, storeName) {
			check(url, String);
			check(file, Object);
			check(storeName, String);

			// Check URL
			if (typeof url !== 'string' || url.length <= 0) {
				throw new Meteor.Error('invalid-url', 'The url is not valid');
			}
			// Check file
			if (typeof file !== 'object' || file === null) {
				throw new Meteor.Error('invalid-file', 'The file is not valid');
			}
			// Check store
			const store = UploadFS.getStore(storeName);
			if (!store) {
				throw new Meteor.Error('invalid-store', 'The store does not exist');
			}

			let parsedUrl;
			try {
				parsedUrl = new URL(url);
			} catch (e) {
				throw new Meteor.Error('invalid-url', 'The url is not valid');
			}

			if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedUrl.hostname)) {
				throw new Meteor.Error('invalid-url', 'URL cannot reference localhost');
			}

			// Extract file info
			if (!file.name) {
				file.name = url.replace(/\?.*$/, '').split('/').pop();
			}
			if (file.name && !file.extension) {
				file.extension = file.name && file.name.substr((~-file.name.lastIndexOf('.') >>> 0) + 2).toLowerCase();
			}
			if (file.extension && !file.type) {
				// Assign file MIME type based on the extension
				file.type = UploadFS.getMimeType(file.extension) || 'application/octet-stream';
			}
			// Check if file is valid
			if (store.getFilter() instanceof Filter) {
				store.getFilter().check(file);
			}

			if (file.originalUrl) {
				console.warn('ufs: The "originalUrl" attribute is automatically set when importing a file from a URL');
			}

			// Add original URL
			file.originalUrl = url;

			// Create the file
			file.complete = false;
			file.uploading = true;
			file.progress = 0;
			file._id = store.create(file);

			const fut = new Future();
			let proto;

			// Detect protocol to use
			if (/http:\/\//i.test(url)) {
				proto = http;
			} else if (/https:\/\//i.test(url)) {
				proto = https;
			}

			this.unblock();

			// Download file
			proto
				.get(
					url,
					Meteor.bindEnvironment(function (res) {
						// Save the file in the store
						store.write(res, file._id, function (err, file) {
							if (err) {
								fut.throw(err);
							} else {
								fut.return(file);
							}
						});
					}),
				)
				.on('error', function (err) {
					fut.throw(err);
				});
			return fut.wait();
		},

		/**
		 * Marks the file uploading as stopped
		 * @param fileId
		 * @param storeName
		 * @param token
		 * @returns {*}
		 */
		ufsStop(fileId, storeName, token) {
			check(fileId, String);
			check(storeName, String);
			check(token, String);

			// Check store
			const store = UploadFS.getStore(storeName);
			if (!store) {
				throw new Meteor.Error('invalid-store', 'Store not found');
			}
			// Check file
			const file = store.getCollection().find({ _id: fileId }, { fields: { userId: 1 } });
			if (!file) {
				throw new Meteor.Error('invalid-file', 'File not found');
			}
			// Check token
			if (!store.checkToken(token, fileId)) {
				throw new Meteor.Error('invalid-token', 'Token is not valid');
			}

			return store.getCollection().update(
				{ _id: fileId },
				{
					$set: { uploading: false },
				},
			);
		},
	});
}
