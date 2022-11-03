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

import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';

import { Store } from './ufs-store';

/**
 * File uploader
 */
export class Uploader {
	constructor(options) {
		const self = this;

		// Set default options
		options = _.extend(
			{
				adaptive: true,
				capacity: 0.9,
				chunkSize: 16 * 1024,
				data: null,
				file: null,
				maxChunkSize: 4 * 1024 * 1000,
				maxTries: 5,
				onAbort: this.onAbort,
				onComplete: this.onComplete,
				onCreate: this.onCreate,
				onError: this.onError,
				onProgress: this.onProgress,
				onStart: this.onStart,
				onStop: this.onStop,
				retryDelay: 2000,
				store: null,
				transferDelay: 100,
			},
			options,
		);

		// Check options
		if (typeof options.adaptive !== 'boolean') {
			throw new TypeError('adaptive is not a number');
		}
		if (typeof options.capacity !== 'number') {
			throw new TypeError('capacity is not a number');
		}
		if (options.capacity <= 0 || options.capacity > 1) {
			throw new RangeError('capacity must be a float between 0.1 and 1.0');
		}
		if (typeof options.chunkSize !== 'number') {
			throw new TypeError('chunkSize is not a number');
		}
		if (!(options.data instanceof Blob) && !(options.data instanceof File)) {
			throw new TypeError('data is not an Blob or File');
		}
		if (options.file === null || typeof options.file !== 'object') {
			throw new TypeError('file is not an object');
		}
		if (typeof options.maxChunkSize !== 'number') {
			throw new TypeError('maxChunkSize is not a number');
		}
		if (typeof options.maxTries !== 'number') {
			throw new TypeError('maxTries is not a number');
		}
		if (typeof options.retryDelay !== 'number') {
			throw new TypeError('retryDelay is not a number');
		}
		if (typeof options.transferDelay !== 'number') {
			throw new TypeError('transferDelay is not a number');
		}
		if (typeof options.onAbort !== 'function') {
			throw new TypeError('onAbort is not a function');
		}
		if (typeof options.onComplete !== 'function') {
			throw new TypeError('onComplete is not a function');
		}
		if (typeof options.onCreate !== 'function') {
			throw new TypeError('onCreate is not a function');
		}
		if (typeof options.onError !== 'function') {
			throw new TypeError('onError is not a function');
		}
		if (typeof options.onProgress !== 'function') {
			throw new TypeError('onProgress is not a function');
		}
		if (typeof options.onStart !== 'function') {
			throw new TypeError('onStart is not a function');
		}
		if (typeof options.onStop !== 'function') {
			throw new TypeError('onStop is not a function');
		}
		if (typeof options.store !== 'string' && !(options.store instanceof Store)) {
			throw new TypeError('store must be the name of the store or an instance of UploadFS.Store');
		}

		// Public attributes
		self.adaptive = options.adaptive;
		self.capacity = parseFloat(options.capacity);
		self.chunkSize = parseInt(options.chunkSize);
		self.maxChunkSize = parseInt(options.maxChunkSize);
		self.maxTries = parseInt(options.maxTries);
		self.retryDelay = parseInt(options.retryDelay);
		self.transferDelay = parseInt(options.transferDelay);
		self.onAbort = options.onAbort;
		self.onComplete = options.onComplete;
		self.onCreate = options.onCreate;
		self.onError = options.onError;
		self.onProgress = options.onProgress;
		self.onStart = options.onStart;
		self.onStop = options.onStop;

		// Private attributes
		let { store } = options;
		const { data } = options;
		const capacityMargin = 0.1;
		let { file } = options;
		let fileId = null;
		let offset = 0;
		let loaded = 0;
		const total = data.size;
		let tries = 0;
		let postUrl = null;
		let token = null;
		let complete = false;
		let uploading = false;

		let timeA = null;
		let timeB = null;

		let elapsedTime = 0;
		let startTime = 0;

		// Keep only the name of the store
		if (store instanceof Store) {
			store = store.getName();
		}

		// Assign file to store
		file.store = store;

		function finish() {
			// Finish the upload by telling the store the upload is complete
			Meteor.call('ufsComplete', fileId, store, token, function (err, uploadedFile) {
				if (err) {
					self.onError(err, file);
					self.abort();
				} else if (uploadedFile) {
					uploading = false;
					complete = true;
					file = uploadedFile;
					self.onComplete(uploadedFile);
				}
			});
		}

		/**
		 * Aborts the current transfer
		 */
		self.abort = function () {
			// Remove the file from database
			// eslint-disable-next-line no-unused-vars
			Meteor.call('ufsDelete', fileId, store, token, function (err, result) {
				if (err) {
					self.onError(err, file);
				}
			});

			// Reset uploader status
			uploading = false;
			fileId = null;
			offset = 0;
			tries = 0;
			loaded = 0;
			complete = false;
			startTime = null;
			self.onAbort(file);
		};

		/**
		 * Returns the average speed in bytes per second
		 * @returns {number}
		 */
		self.getAverageSpeed = function () {
			const seconds = self.getElapsedTime() / 1000;
			return self.getLoaded() / seconds;
		};

		/**
		 * Returns the elapsed time in milliseconds
		 * @returns {number}
		 */
		self.getElapsedTime = function () {
			if (startTime && self.isUploading()) {
				return elapsedTime + (Date.now() - startTime);
			}
			return elapsedTime;
		};

		/**
		 * Returns the file
		 * @return {object}
		 */
		self.getFile = function () {
			return file;
		};

		/**
		 * Returns the loaded bytes
		 * @return {number}
		 */
		self.getLoaded = function () {
			return loaded;
		};

		/**
		 * Returns current progress
		 * @return {number}
		 */
		self.getProgress = function () {
			return Math.min(((loaded / total) * 100) / 100, 1.0);
		};

		/**
		 * Returns the remaining time in milliseconds
		 * @returns {number}
		 */
		self.getRemainingTime = function () {
			const averageSpeed = self.getAverageSpeed();
			const remainingBytes = total - self.getLoaded();
			return averageSpeed && remainingBytes ? Math.max(remainingBytes / averageSpeed, 0) : 0;
		};

		/**
		 * Returns the upload speed in bytes per second
		 * @returns {number}
		 */
		self.getSpeed = function () {
			if (timeA && timeB && self.isUploading()) {
				const seconds = (timeB - timeA) / 1000;
				return self.chunkSize / seconds;
			}
			return 0;
		};

		/**
		 * Returns the total bytes
		 * @return {number}
		 */
		self.getTotal = function () {
			return total;
		};

		/**
		 * Checks if the transfer is complete
		 * @return {boolean}
		 */
		self.isComplete = function () {
			return complete;
		};

		/**
		 * Checks if the transfer is active
		 * @return {boolean}
		 */
		self.isUploading = function () {
			return uploading;
		};

		/**
		 * Reads a portion of file
		 * @param start
		 * @param length
		 * @param callback
		 * @returns {Blob}
		 */
		self.readChunk = function (start, length, callback) {
			if (typeof callback !== 'function') {
				throw new Error('readChunk is missing callback');
			}
			try {
				let end;

				// Calculate the chunk size
				if (length && start + length > total) {
					end = total;
				} else {
					end = start + length;
				}
				// Get chunk
				const chunk = data.slice(start, end);
				// Pass chunk to callback
				callback.call(self, null, chunk);
			} catch (err) {
				console.error('read error', err);
				// Retry to read chunk
				Meteor.setTimeout(function () {
					if (tries < self.maxTries) {
						tries += 1;
						self.readChunk(start, length, callback);
					}
				}, self.retryDelay);
			}
		};

		/**
		 * Sends a file chunk to the store
		 */
		self.sendChunk = function () {
			if (!complete && startTime !== null) {
				if (offset < total) {
					let { chunkSize } = self;

					// Use adaptive length
					if (self.adaptive && timeA && timeB && timeB > timeA) {
						const duration = (timeB - timeA) / 1000;
						const max = self.capacity * (1 + capacityMargin);
						const min = self.capacity * (1 - capacityMargin);

						if (duration >= max) {
							chunkSize = Math.abs(Math.round(chunkSize * (max - duration)));
						} else if (duration < min) {
							chunkSize = Math.round(chunkSize * (min / duration));
						}
						// Limit to max chunk size
						if (self.maxChunkSize > 0 && chunkSize > self.maxChunkSize) {
							chunkSize = self.maxChunkSize;
						}
					}

					// Reduce chunk size to fit total
					if (offset + chunkSize > total) {
						chunkSize = total - offset;
					}

					// Prepare the chunk
					self.readChunk(offset, chunkSize, function (err, chunk) {
						if (err) {
							self.onError(err, file);
							return;
						}

						const xhr = new XMLHttpRequest();
						xhr.onreadystatechange = function () {
							if (xhr.readyState === 4) {
								if ([200, 201, 202, 204].includes(xhr.status)) {
									timeB = Date.now();
									offset += chunkSize;
									loaded += chunkSize;

									// Send next chunk
									self.onProgress(file, self.getProgress());

									// Finish upload
									if (loaded >= total) {
										elapsedTime = Date.now() - startTime;
										finish();
									} else {
										Meteor.setTimeout(self.sendChunk, self.transferDelay);
									}
								} else if (![402, 403, 404, 500].includes(xhr.status)) {
									// Retry until max tries is reach
									// But don't retry if these errors occur
									if (tries <= self.maxTries) {
										tries += 1;
										// Wait before retrying
										Meteor.setTimeout(self.sendChunk, self.retryDelay);
									} else {
										self.abort();
									}
								} else {
									self.abort();
								}
							}
						};

						// Calculate upload progress
						const progress = (offset + chunkSize) / total;
						// let formData = new FormData();
						// formData.append('progress', progress);
						// formData.append('chunk', chunk);
						const url = `${postUrl}&progress=${progress}`;

						timeA = Date.now();
						timeB = null;
						uploading = true;

						// Send chunk to the store
						xhr.open('POST', url, true);
						xhr.send(chunk);
					});
				}
			}
		};

		/**
		 * Starts or resumes the transfer
		 */
		self.start = function () {
			if (!fileId) {
				// Create the file document and get the token
				// that allows the user to send chunks to the store.
				Meteor.call('ufsCreate', _.extend({}, file), function (err, result) {
					if (err) {
						self.onError(err, file);
					} else if (result) {
						token = result.token;
						postUrl = result.url;
						fileId = result.fileId;
						file._id = result.fileId;
						self.onCreate(file);
						tries = 0;
						startTime = Date.now();
						self.onStart(file);
						self.sendChunk();
					}
				});
			} else if (!uploading && !complete) {
				// Resume uploading
				tries = 0;
				startTime = Date.now();
				self.onStart(file);
				self.sendChunk();
			}
		};

		/**
		 * Stops the transfer
		 */
		self.stop = function () {
			if (uploading) {
				// Update elapsed time
				elapsedTime = Date.now() - startTime;
				startTime = null;
				uploading = false;
				self.onStop(file);

				// eslint-disable-next-line no-unused-vars
				Meteor.call('ufsStop', fileId, store, token, function (err, result) {
					if (err) {
						self.onError(err, file);
					}
				});
			}
		};
	}

	/**
	 * Called when the file upload is aborted
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onAbort(file) {}

	/**
	 * Called when the file upload is complete
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onComplete(file) {}

	/**
	 * Called when the file is created in the collection
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onCreate(file) {}

	/**
	 * Called when an error occurs during file upload
	 * @param err
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onError(err, file) {
		console.error(`ufs: ${err.message}`);
	}

	/**
	 * Called when a file chunk has been sent
	 * @param file
	 * @param progress is a float from 0.0 to 1.0
	 */
	// eslint-disable-next-line no-unused-vars
	onProgress(file, progress) {}

	/**
	 * Called when the file upload starts
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onStart(file) {}

	/**
	 * Called when the file upload stops
	 * @param file
	 */
	// eslint-disable-next-line no-unused-vars
	onStop(file) {}
}
