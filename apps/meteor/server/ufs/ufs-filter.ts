import type { IUpload } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import type { OptionalId } from 'mongodb';

type IFilterOptions = {
	contentTypes?: string[];
	extensions?: string[];
	minSize?: number;
	maxSize?: number;
	onCheck?: (file: IUpload, content?: Buffer) => Promise<boolean>;
	invalidFileError?: () => Meteor.Error;
	fileTooSmallError?: (fileSize: number, minFileSize: number) => Meteor.Error;
	fileTooLargeError?: (fileSize: number, maxFileSize: number) => Meteor.Error;
	invalidFileExtension?: (fileExtension: string, allowedExtensions: string[]) => Meteor.Error;
	invalidFileType?: (fileType: string | undefined, allowedContentTypes: string[]) => Meteor.Error;
};

export class Filter {
	private options: Required<IFilterOptions>;

	constructor(options: IFilterOptions) {
		this.options = {
			contentTypes: [],
			extensions: [],
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
			...options,
		};

		// Check options
		if (this.options.contentTypes && !(this.options.contentTypes instanceof Array)) {
			throw new TypeError('Filter: contentTypes is not an Array');
		}
		if (this.options.extensions && !(this.options.extensions instanceof Array)) {
			throw new TypeError('Filter: extensions is not an Array');
		}
		if (typeof this.options.minSize !== 'number') {
			throw new TypeError('Filter: minSize is not a number');
		}
		if (typeof this.options.maxSize !== 'number') {
			throw new TypeError('Filter: maxSize is not a number');
		}
		if (this.options.onCheck && typeof this.options.onCheck !== 'function') {
			throw new TypeError('Filter: onCheck is not a function');
		}

		if (typeof this.options.onCheck === 'function') {
			this.onCheck = this.options.onCheck;
		}
	}

	async check(file: OptionalId<IUpload>, content?: ReadableStream | Buffer) {
		let error = null;
		if (typeof file !== 'object' || !file) {
			error = this.options.invalidFileError();
		}
		// Check size
		const fileSize = file.size || 0;
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
		const fileExtension = file.extension || '';
		if (allowedExtensions.length && !allowedExtensions.includes(fileExtension)) {
			error = this.options.invalidFileExtension(fileExtension, allowedExtensions);
		}
		// Check content type
		const allowedContentTypes = this.getContentTypes();
		const fileTypes = file.type;
		if (allowedContentTypes.length && !this.isContentTypeInList(fileTypes, allowedContentTypes)) {
			error = this.options.invalidFileType(fileTypes, allowedContentTypes);
		}
		// Apply custom check
		if (typeof this.onCheck === 'function' && !(await this.onCheck(file, content))) {
			error = new Meteor.Error('invalid-file', 'File does not match filter');
		}

		if (error) {
			throw error;
		}
	}

	getContentTypes() {
		return this.options.contentTypes;
	}

	getExtensions() {
		return this.options.extensions;
	}

	getMaxSize() {
		return this.options.maxSize;
	}

	getMinSize() {
		return this.options.minSize;
	}

	isContentTypeInList(type: string | undefined, list: string[]) {
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

	async isValid(file: IUpload) {
		let result = true;
		try {
			await this.check(file);
		} catch (err) {
			result = false;
		}
		return result;
	}

	async onCheck(_file: OptionalId<IUpload>, _content?: ReadableStream | Buffer) {
		return true;
	}
}
