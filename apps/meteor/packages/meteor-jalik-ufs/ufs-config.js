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

import { _ } from 'meteor/underscore';

import { StorePermissions } from './ufs-store-permissions';

/**
 * UploadFS configuration
 */
export class Config {
	constructor(options) {
		// Default options
		options = _.extend(
			{
				defaultStorePermissions: null,
				https: false,
				simulateReadDelay: 0,
				simulateUploadSpeed: 0,
				simulateWriteDelay: 0,
				storesPath: 'ufs',
				tmpDir: '/tmp/ufs',
				tmpDirPermissions: '0700',
			},
			options,
		);

		// Check options
		if (options.defaultStorePermissions && !(options.defaultStorePermissions instanceof StorePermissions)) {
			throw new TypeError('Config: defaultStorePermissions is not an instance of StorePermissions');
		}
		if (typeof options.https !== 'boolean') {
			throw new TypeError('Config: https is not a function');
		}
		if (typeof options.simulateReadDelay !== 'number') {
			throw new TypeError('Config: simulateReadDelay is not a number');
		}
		if (typeof options.simulateUploadSpeed !== 'number') {
			throw new TypeError('Config: simulateUploadSpeed is not a number');
		}
		if (typeof options.simulateWriteDelay !== 'number') {
			throw new TypeError('Config: simulateWriteDelay is not a number');
		}
		if (typeof options.storesPath !== 'string') {
			throw new TypeError('Config: storesPath is not a string');
		}
		if (typeof options.tmpDir !== 'string') {
			throw new TypeError('Config: tmpDir is not a string');
		}
		if (typeof options.tmpDirPermissions !== 'string') {
			throw new TypeError('Config: tmpDirPermissions is not a string');
		}

		/**
		 * Default store permissions
		 * @type {UploadFS.StorePermissions}
		 */
		this.defaultStorePermissions = options.defaultStorePermissions;
		/**
		 * Use or not secured protocol in URLS
		 * @type {boolean}
		 */
		this.https = options.https;
		/**
		 * The simulation read delay
		 * @type {Number}
		 */
		this.simulateReadDelay = parseInt(options.simulateReadDelay);
		/**
		 * The simulation upload speed
		 * @type {Number}
		 */
		this.simulateUploadSpeed = parseInt(options.simulateUploadSpeed);
		/**
		 * The simulation write delay
		 * @type {Number}
		 */
		this.simulateWriteDelay = parseInt(options.simulateWriteDelay);
		/**
		 * The URL root path of stores
		 * @type {string}
		 */
		this.storesPath = options.storesPath;
		/**
		 * The temporary directory of uploading files
		 * @type {string}
		 */
		this.tmpDir = options.tmpDir;
		/**
		 * The permissions of the temporary directory
		 * @type {string}
		 */
		this.tmpDirPermissions = options.tmpDirPermissions;
	}
}
