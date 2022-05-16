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
import { Random } from 'meteor/random';

import { Config } from './ufs-config';
import { Filter } from './ufs-filter';
import { MIME } from './ufs-mime';
import { Store } from './ufs-store';
import { StorePermissions } from './ufs-store-permissions';
import { Tokens } from './ufs-tokens';
import { Uploader } from './ufs-uploader';

const stores = {};

export const UploadFS = {
	/**
	 * Contains all stores
	 */
	store: {},

	/**
	 * Collection of tokens
	 */
	tokens: Tokens,

	/**
	 * Adds the "etag" attribute to files
	 * @param where
	 */
	addETagAttributeToFiles(where) {
		this.getStores().forEach((store) => {
			const files = store.getCollection();

			// By default update only files with no path set
			files.find(where || { etag: null }, { fields: { _id: 1 } }).forEach((file) => {
				files.direct.update(file._id, { $set: { etag: this.generateEtag() } });
			});
		});
	},

	/**
	 * Adds the MIME type for an extension
	 * @param extension
	 * @param mime
	 */
	addMimeType(extension, mime) {
		MIME[extension.toLowerCase()] = mime;
	},

	/**
	 * Adds the "path" attribute to files
	 * @param where
	 */
	addPathAttributeToFiles(where) {
		this.getStores().forEach((store) => {
			const files = store.getCollection();

			// By default update only files with no path set
			files.find(where || { path: null }, { fields: { _id: 1 } }).forEach((file) => {
				files.direct.update(file._id, { $set: { path: store.getFileRelativeURL(file._id) } });
			});
		});
	},

	/**
	 * Registers the store
	 * @param store
	 */
	addStore(store) {
		if (!(store instanceof Store)) {
			throw new TypeError('ufs: store is not an instance of UploadFS.Store.');
		}
		stores[store.getName()] = store;
	},

	/**
	 * Generates a unique ETag
	 * @return {string}
	 */
	generateEtag() {
		return Random.id();
	},

	/**
	 * Returns the MIME type of the extension
	 * @param extension
	 * @returns {*}
	 */
	getMimeType(extension) {
		extension = extension.toLowerCase();
		return MIME[extension];
	},

	/**
	 * Returns all MIME types
	 */
	getMimeTypes() {
		return MIME;
	},

	/**
	 * Returns the store by its name
	 * @param name
	 * @return {UploadFS.Store}
	 */
	getStore(name) {
		return stores[name];
	},

	/**
	 * Returns all stores
	 * @return {object}
	 */
	getStores() {
		return stores;
	},

	/**
	 * Returns the temporary file path
	 * @param fileId
	 * @return {string}
	 */
	getTempFilePath(fileId) {
		return `${this.config.tmpDir}/${fileId}`;
	},

	/**
	 * Imports a file from a URL
	 * @param url
	 * @param file
	 * @param store
	 * @param callback
	 */
	importFromURL(url, file, store, callback) {
		if (typeof store === 'string') {
			Meteor.call('ufsImportURL', url, file, store, callback);
		} else if (typeof store === 'object') {
			store.importFromURL(url, file, callback);
		}
	},

	/**
	 * Returns file and data as ArrayBuffer for each files in the event
	 * @deprecated
	 * @param event
	 * @param callback
	 */
	readAsArrayBuffer() {
		console.error('UploadFS.readAsArrayBuffer is deprecated, see https://github.com/jalik/jalik-ufs#uploading-from-a-file');
	},

	/**
	 * Opens a dialog to select a single file
	 * @param callback
	 */
	selectFile(callback) {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = false;
		input.onchange = (ev) => {
			const { files } = ev.target;
			callback.call(UploadFS, files[0]);
		};
		// Fix for iOS/Safari
		const div = document.createElement('div');
		div.className = 'ufs-file-selector';
		div.style = 'display:none; height:0; width:0; overflow: hidden;';
		div.appendChild(input);
		document.body.appendChild(div);
		// Trigger file selection
		input.click();
	},

	/**
	 * Opens a dialog to select multiple files
	 * @param callback
	 */
	selectFiles(callback) {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.onchange = (ev) => {
			const { files } = ev.target;

			for (let i = 0; i < files.length; i += 1) {
				callback.call(UploadFS, files[i]);
			}
		};
		// Fix for iOS/Safari
		const div = document.createElement('div');
		div.className = 'ufs-file-selector';
		div.style = 'display:none; height:0; width:0; overflow: hidden;';
		div.appendChild(input);
		document.body.appendChild(div);
		// Trigger file selection
		input.click();
	},
};

if (Meteor.isServer) {
	require('./ufs-methods');
	require('./ufs-server');
}

/**
 * UploadFS Configuration
 * @type {Config}
 */
UploadFS.config = new Config();

// Add classes to global namespace
UploadFS.Config = Config;
UploadFS.Filter = Filter;
UploadFS.Store = Store;
UploadFS.StorePermissions = StorePermissions;
UploadFS.Uploader = Uploader;

if (Meteor.isServer) {
	// Expose the module globally
	if (typeof global !== 'undefined') {
		global.UploadFS = UploadFS;
	}
} else if (Meteor.isClient) {
	// Expose the module globally
	if (typeof window !== 'undefined') {
		window.UploadFS = UploadFS;
	}
}
