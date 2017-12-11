import { Progress } from './ImporterProgress';
import { ProgressStep } from '../../lib/ImporterProgressStep';
import { Selection } from './ImporterSelection';
import { Imports } from '../models/Imports';
import { ImporterInfo } from '../../lib/ImporterInfo';
import { RawImports } from '../models/RawImports';
import { ImporterWebsocket } from './ImporterWebsocket';

import http from 'http';
import https from 'https';
import AdmZip from 'adm-zip';
import getFileType from 'file-type';

/**
 * Base class for all of the importers.
 */
export class Base {
	/**
	 * The max BSON object size we can store in MongoDB is 16777216 bytes
	 * but for some reason the mongo instanace which comes with Meteor
	 * errors out for anything close to that size. So, we are rounding it
	 * down to 8000000 bytes.
	 *
	 * @param {any} item The item to calculate the BSON size of.
	 * @returns {number} The size of the item passed in.
	 * @static
	 */
	static getBSONSize(item) {
		const { BSON } = require('bson').native();
		const bson = new BSON();
		return bson.calculateObjectSize(item);
	}

	/**
	 * The max BSON object size we can store in MongoDB is 16777216 bytes
	 * but for some reason the mongo instanace which comes with Meteor
	 * errors out for anything close to that size. So, we are rounding it
	 * down to 8000000 bytes.
	 *
	 * @returns {number} 8000000 bytes.
	 */
	static getMaxBSONSize() {
		return 8000000;
	}

	/**
	 * Splits the passed in array to at least one array which has a size that
	 * is safe to store in the database.
	 *
	 * @param {any[]} theArray The array to split out
	 * @returns {any[][]} The safe sized arrays
	 * @static
	 */
	static getBSONSafeArraysFromAnArray(theArray) {
		const BSONSize = Base.getBSONSize(theArray);
		const maxSize = Math.floor(theArray.length / (Math.ceil(BSONSize / Base.getMaxBSONSize())));
		const safeArrays = [];
		let i = 0;
		while (i < theArray.length) {
			safeArrays.push(theArray.slice(i, (i += maxSize)));
		}
		return safeArrays;
	}

	/**
	 * Constructs a new importer, adding an empty collection, AdmZip property, and empty users & channels
	 *
	 * @param {string} name The importer's name.
	 * @param {string} description The i18n string which describes the importer
	 * @param {string} mimeType The expected file type.
	 */
	constructor(info) {
		if (!(info instanceof ImporterInfo)) {
			throw new Error('Information passed in must be a valid ImporterInfo instance.');
		}

		this.http = http;
		this.https = https;
		this.AdmZip = AdmZip;
		this.getFileType = getFileType;

		this.prepare = this.prepare.bind(this);
		this.startImport = this.startImport.bind(this);
		this.getSelection = this.getSelection.bind(this);
		this.getProgress = this.getProgress.bind(this);
		this.updateProgress = this.updateProgress.bind(this);
		this.addCountToTotal = this.addCountToTotal.bind(this);
		this.addCountCompleted = this.addCountCompleted.bind(this);
		this.updateRecord = this.updateRecord.bind(this);
		this.uploadFile = this.uploadFile.bind(this);

		this.info = info;

		this.logger = new Logger(`${ this.info.name } Importer`, {});
		this.progress = new Progress(this.info.key, this.info.name);
		this.collection = RawImports;

		const importId = Imports.insert({ 'type': this.info.name, 'ts': Date.now(), 'status': this.progress.step, 'valid': true, 'user': Meteor.user()._id });
		this.importRecord = Imports.findOne(importId);

		this.users = {};
		this.channels = {};
		this.messages = {};
		this.oldSettings = {};

		this.logger.debug(`Constructed a new ${ info.name } Importer.`);
	}

	/**
	 * Takes the uploaded file and extracts the users, channels, and messages from it.
	 *
	 * @param {string} dataURI Base64 string of the uploaded file
	 * @param {string} sentContentType The sent file type.
	 * @param {string} fileName The name of the uploaded file.
	 * @param {boolean} skipTypeCheck Optional property that says to not check the type provided.
	 * @returns {Progress} The progress record of the import.
	 */
	prepare(dataURI, sentContentType, fileName, skipTypeCheck) {
		if (!skipTypeCheck) {
			const fileType = this.getFileType(new Buffer(dataURI.split(',')[1], 'base64'));
			this.logger.debug('Uploaded file information is:', fileType);
			this.logger.debug('Expected file type is:', this.info.mimeType);

			if (!fileType || (fileType.mime !== this.info.mimeType)) {
				this.logger.warn(`Invalid file uploaded for the ${ this.info.name } importer.`);
				this.updateProgress(ProgressStep.ERROR);
				throw new Meteor.Error('error-invalid-file-uploaded', `Invalid file uploaded to import ${ this.info.name } data from.`, { step: 'prepare' });
			}
		}

		this.updateProgress(ProgressStep.PREPARING_STARTED);
		return this.updateRecord({ 'file': fileName });
	}

	/**
	 * Starts the import process. The implementing method should defer
	 * as soon as the selection is set, so the user who started the process
	 * doesn't end up with a "locked" UI while Meteor waits for a response.
	 * The returned object should be the progress.
	 *
	 * @param {Selection} importSelection The selection data.
	 * @returns {Progress} The progress record of the import.
	 */
	startImport(importSelection) {
		if (!(importSelection instanceof Selection)) {
			throw new Error(`Invalid Selection data provided to the ${ this.info.name } importer.`);
		} else if (importSelection.users === undefined) {
			throw new Error(`Users in the selected data wasn't found, it must but at least an empty array for the ${ this.info.name } importer.`);
		} else if (importSelection.channels === undefined) {
			throw new Error(`Channels in the selected data wasn't found, it must but at least an empty array for the ${ this.info.name } importer.`);
		}

		return this.updateProgress(ProgressStep.IMPORTING_STARTED);
	}

	/**
	 * Gets the Selection object for the import.
	 *
	 * @returns {Selection} The users and channels selection
	 */
	getSelection() {
		throw new Error(`Invalid 'getSelection' called on ${ this.info.name }, it must be overridden and super can not be called.`);
	}

	/**
	 * Gets the progress of this import.
	 *
	 * @returns {Progress} The progress record of the import.
	 */
	getProgress() {
		return this.progress;
	}

	/**
	 * Updates the progress step of this importer.
	 * It also changes some internal settings at various stages of the import.
	 * This way the importer can adjust user/room information at will.
	 *
	 * @param {ProgressStep} step The progress step which this import is currently at.
	 * @returns {Progress} The progress record of the import.
	 */
	updateProgress(step) {
		this.progress.step = step;

		switch (step) {
			case ProgressStep.IMPORTING_STARTED:
				this.oldSettings.Accounts_AllowedDomainsList = RocketChat.models.Settings.findOneById('Accounts_AllowedDomainsList').value;
				RocketChat.models.Settings.updateValueById('Accounts_AllowedDomainsList', '');

				this.oldSettings.Accounts_AllowUsernameChange = RocketChat.models.Settings.findOneById('Accounts_AllowUsernameChange').value;
				RocketChat.models.Settings.updateValueById('Accounts_AllowUsernameChange', true);
				break;
			case ProgressStep.DONE:
			case ProgressStep.ERROR:
				RocketChat.models.Settings.updateValueById('Accounts_AllowedDomainsList', this.oldSettings.Accounts_AllowedDomainsList);
				RocketChat.models.Settings.updateValueById('Accounts_AllowUsernameChange', this.oldSettings.Accounts_AllowUsernameChange);
				break;
		}

		this.logger.debug(`${ this.info.name } is now at ${ step }.`);
		this.updateRecord({ 'status': this.progress.step });

		ImporterWebsocket.progressUpdated(this.progress);

		return this.progress;
	}

	/**
	 * Adds the passed in value to the total amount of items needed to complete.
	 *
	 * @param {number} count The amount to add to the total count of items.
	 * @returns {Progress} The progress record of the import.
	 */
	addCountToTotal(count) {
		this.progress.count.total = this.progress.count.total + count;
		this.updateRecord({ 'count.total': this.progress.count.total });

		return this.progress;
	}

	/**
	 * Adds the passed in value to the total amount of items completed.
	 *
	 * @param {number} count The amount to add to the total count of finished items.
	 * @returns {Progress} The progress record of the import.
	 */
	addCountCompleted(count) {
		this.progress.count.completed = this.progress.count.completed + count;

		//Only update the database every 500 records
		//Or the completed is greater than or equal to the total amount
		if (((this.progress.count.completed % 500) === 0) || (this.progress.count.completed >= this.progress.count.total)) {
			this.updateRecord({ 'count.completed': this.progress.count.completed });
		}

		ImporterWebsocket.progressUpdated(this.progress);

		return this.progress;
	}

	/**
	 * Updates the import record with the given fields being `set`.
	 *
	 * @param {any} fields The fields to set, it should be an object with key/values.
	 * @returns {Imports} The import record.
	 */
	updateRecord(fields) {
		Imports.update({ _id: this.importRecord._id }, { $set: fields });
		this.importRecord = Imports.findOne(this.importRecord._id);

		return this.importRecord;
	}

	/**
	 * Uploads the file to the storage.
	 *
	 * @param {any} details An object with details about the upload: `name`, `size`, `type`, and `rid`.
	 * @param {string} fileUrl Url of the file to download/import.
	 * @param {any} user The Rocket.Chat user.
	 * @param {any} room The Rocket.Chat Room.
	 * @param {Date} timeStamp The timestamp the file was uploaded
	 */
	uploadFile(details, fileUrl, user, room, timeStamp) {
		this.logger.debug(`Uploading the file ${ details.name } from ${ fileUrl }.`);
		const requestModule = /https/i.test(fileUrl) ? this.https : this.http;

		const fileStore = FileUpload.getStore('Uploads');

		return requestModule.get(fileUrl, Meteor.bindEnvironment(function(res) {
			const rawData = [];
			res.on('data', chunk => rawData.push(chunk));
			res.on('end', Meteor.bindEnvironment(() => {
				fileStore.insert(details, Buffer.concat(rawData), function(err, file) {
					if (err) {
						throw new Error(err);
					} else {
						const url = file.url.replace(Meteor.absoluteUrl(), '/');

						const attachment = {
							title: file.name,
							title_link: url
						};

						if (/^image\/.+/.test(file.type)) {
							attachment.image_url = url;
							attachment.image_type = file.type;
							attachment.image_size = file.size;
							attachment.image_dimensions = file.identify != null ? file.identify.size : undefined;
						}

						if (/^audio\/.+/.test(file.type)) {
							attachment.audio_url = url;
							attachment.audio_type = file.type;
							attachment.audio_size = file.size;
						}

						if (/^video\/.+/.test(file.type)) {
							attachment.video_url = url;
							attachment.video_type = file.type;
							attachment.video_size = file.size;
						}

						const msg = {
							rid: details.rid,
							ts: timeStamp,
							msg: '',
							file: {
								_id: file._id
							},
							groupable: false,
							attachments: [attachment]
						};

						if ((details.message_id != null) && (typeof details.message_id === 'string')) {
							msg['_id'] = details.message_id;
						}

						return RocketChat.sendMessage(user, msg, room, true);
					}
				});
			}));
		}));
	}
}
