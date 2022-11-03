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

/**
 * File filter
 */
export class Filter {
	constructor(options) {
		const self = this;

		// Default options
		options = _.extend(
			{
				contentTypes: null,
				extensions: null,
				minSize: 1,
				maxSize: 0,
				invalidFileError: () => new Meteor.Error('invalid-file', 'File is not valid'),
				fileTooSmallError: (fileSize, minFileSize) =>
					new Meteor.Error('file-too-small', `File size (size = ${fileSize}) is too small (min = ${minFileSize})`),
				fileTooLargeError: (fileSize, maxFileSize) =>
					new Meteor.Error('file-too-large', `File size (size = ${fileSize}) is too large (max = ${maxFileSize})`),
				invalidFileExtension: (fileExtension, allowedExtensions) =>
					new Meteor.Error('invalid-file-extension', `File extension "${fileExtension}" is not accepted (${allowedExtensions})`),
				invalidFileType: (fileType, allowedContentTypes) =>
					new Meteor.Error('invalid-file-type', `File type "${fileType}" is not accepted (${allowedContentTypes})`),
				onCheck: this.onCheck,
			},
			options,
		);

		// Check options
		if (options.contentTypes && !(options.contentTypes instanceof Array)) {
			throw new TypeError('Filter: contentTypes is not an Array');
		}
		if (options.extensions && !(options.extensions instanceof Array)) {
			throw new TypeError('Filter: extensions is not an Array');
		}
		if (typeof options.minSize !== 'number') {
			throw new TypeError('Filter: minSize is not a number');
		}
		if (typeof options.maxSize !== 'number') {
			throw new TypeError('Filter: maxSize is not a number');
		}
		if (options.onCheck && typeof options.onCheck !== 'function') {
			throw new TypeError('Filter: onCheck is not a function');
		}

		// Public attributes
		self.options = options;
		['onCheck'].forEach((method) => {
			if (typeof options[method] === 'function') {
				self[method] = options[method];
			}
		});
	}

	/**
	 * Checks the file
	 * @param file
	 */
	check(file) {
		let error = null;
		if (typeof file !== 'object' || !file) {
			error = this.options.invalidFileError();
		}
		// Check size
		const fileSize = file.size;
		const minSize = this.getMinSize();
		if (fileSize <= 0 || fileSize < minSize) {
			error = this.options.fileTooSmallError(fileSize, minSize);
		}
		const maxSize = this.getMaxSize();
		if (maxSize > 0 && fileSize > maxSize) {
			error = this.options.fileTooLargeError(fileSize, maxSize);
		}
		// Check extension
		const allowedExtensions = this.getExtensions();
		const fileExtension = file.extension;
		if (allowedExtensions && !allowedExtensions.includes(fileExtension)) {
			error = this.options.invalidFileExtension(fileExtension, allowedExtensions);
		}
		// Check content type
		const allowedContentTypes = this.getContentTypes();
		const fileTypes = file.type;
		if (allowedContentTypes && !this.isContentTypeInList(fileTypes, allowedContentTypes)) {
			error = this.options.invalidFileType(fileTypes, allowedContentTypes);
		}
		// Apply custom check
		if (typeof this.onCheck === 'function' && !this.onCheck(file)) {
			error = new Meteor.Error('invalid-file', 'File does not match filter');
		}

		if (error) {
			throw error;
		}
	}

	/**
	 * Returns the allowed content types
	 * @return {Array}
	 */
	getContentTypes() {
		return this.options.contentTypes;
	}

	/**
	 * Returns the allowed extensions
	 * @return {Array}
	 */
	getExtensions() {
		return this.options.extensions;
	}

	/**
	 * Returns the maximum file size
	 * @return {Number}
	 */
	getMaxSize() {
		return this.options.maxSize;
	}

	/**
	 * Returns the minimum file size
	 * @return {Number}
	 */
	getMinSize() {
		return this.options.minSize;
	}

	/**
	 * Checks if content type is in the given list
	 * @param type
	 * @param list
	 * @return {boolean}
	 */
	isContentTypeInList(type, list) {
		if (typeof type === 'string' && list instanceof Array) {
			if (list.includes(type)) {
				return true;
			}
			const wildCardGlob = '/*';
			const wildcards = list.filter((item) => item.indexOf(wildCardGlob) > 0);

			if (wildcards.includes(type.replace(/(\/.*)$/, wildCardGlob))) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Checks if the file matches filter
	 * @param file
	 * @return {boolean}
	 */
	isValid(file) {
		let result = true;
		try {
			this.check(file);
		} catch (err) {
			result = false;
		}
		return result;
	}

	/**
	 * Executes custom checks
	 * @param file
	 * @return {boolean}
	 */
	// eslint-disable-next-line no-unused-vars
	onCheck(file) {
		return true;
	}
}
