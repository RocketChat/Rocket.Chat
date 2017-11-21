/* globals Importer */
// Base class for all Importers.
//
// @example How to subclass an importer
// 	class ExampleImporter extends RocketChat.importTool._baseImporter
//		constructor: ->
//			super('Name of Importer', 'Description of the importer, use i18n string.', new RegExp('application\/.*?zip'))
//		prepare: (uploadedFileData, uploadedFileContentType, uploadedFileName) =>
//			super
//		startImport: (selectedUsersAndChannels) =>
//			super
//		getProgress: =>
//			#return the progress report, tbd what is expected
// @version 1.0.0
import http from 'http';
import https from 'https';
import AdmZip from 'adm-zip';
import getFileType from 'file-type';

Importer.Base = class Base {
	static getBSONSize(object) {
		// The max BSON object size we can store in MongoDB is 16777216 bytes
		// but for some reason the mongo instanace which comes with meteor
		// errors out for anything close to that size. So, we are rounding it
		// down to 8000000 bytes.
		const { BSON } = require('bson').native();
		const bson = new BSON();
		return bson.calculateObjectSize(object);
	}

	static getBSONSafeArraysFromAnArray(theArray) {
		const BSONSize = Importer.Base.getBSONSize(theArray);
		const maxSize = Math.floor(theArray.length / (Math.ceil(BSONSize / Importer.Base.MaxBSONSize)));
		const safeArrays = [];
		let i = 0;
		while (i < theArray.length) {
			safeArrays.push(theArray.slice(i, (i += maxSize)));
		}
		return safeArrays;
	}

	// Constructs a new importer, adding an empty collection, AdmZip property, and empty users & channels
	//
	// @param [String] name the name of the Importer
	// @param [String] description the i18n string which describes the importer
	// @param [String] mimeType the of the expected file type
	//
	constructor(name, description, mimeType) {
		this.http = http;
		this.https = https;
		this.AdmZip = AdmZip;
		this.getFileType = getFileType;

		this.MaxBSONSize = 8000000;
		this.prepare = this.prepare.bind(this);
		this.startImport = this.startImport.bind(this);
		this.getSelection = this.getSelection.bind(this);
		this.getProgress = this.getProgress.bind(this);
		this.updateProgress = this.updateProgress.bind(this);
		this.addCountToTotal = this.addCountToTotal.bind(this);
		this.addCountCompleted = this.addCountCompleted.bind(this);
		this.updateRecord = this.updateRecord.bind(this);
		this.uploadFile = this.uploadFile.bind(this);

		this.name = name;
		this.description = description;
		this.mimeType = mimeType;

		this.logger = new Logger(`${ this.name } Importer`, {});
		this.progress = new Importer.Progress(this.name);
		this.collection = Importer.RawImports;

		const importId = Importer.Imports.insert({ 'type': this.name, 'ts': Date.now(), 'status': this.progress.step, 'valid': true, 'user': Meteor.user()._id });
		this.importRecord = Importer.Imports.findOne(importId);

		this.users = {};
		this.channels = {};
		this.messages = {};
		this.oldSettings = {};
	}

	// Takes the uploaded file and extracts the users, channels, and messages from it.
	//
	// @param [String] dataURI a base64 string of the uploaded file
	// @param [String] sentContentType the file type
	// @param [String] fileName the name of the uploaded file
	//
	// @return [Importer.Selection] Contains two properties which are arrays of objects, `channels` and `users`.
	//
	prepare(dataURI, sentContentType, fileName) {
		const fileType = this.getFileType(new Buffer(dataURI.split(',')[1], 'base64'));
		this.logger.debug('Uploaded file information is:', fileType);
		this.logger.debug('Expected file type is:', this.mimeType);

		if (!fileType || (fileType.mime !== this.mimeType)) {
			this.logger.warn(`Invalid file uploaded for the ${ this.name } importer.`);
			this.updateProgress(Importer.ProgressStep.ERROR);
			throw new Meteor.Error('error-invalid-file-uploaded', `Invalid file uploaded to import ${ this.name } data from.`, { step: 'prepare' });
		}

		this.updateProgress(Importer.ProgressStep.PREPARING_STARTED);
		return this.updateRecord({ 'file': fileName });
	}

	// Starts the import process. The implementing method should defer as soon as the selection is set, so the user who started the process
	// doesn't end up with a "locked" ui while meteor waits for a response. The returned object should be the progress.
	//
	// @param [Importer.Selection] selectedUsersAndChannels an object with `channels` and `users` which contains information about which users and channels to import
	//
	// @return [Importer.Progress] the progress of the import
	//
	startImport(importSelection) {
		if (importSelection === undefined) {
			throw new Error(`No selected users and channel data provided to the ${ this.name } importer.`); //TODO: Make translatable
		} else if (importSelection.users === undefined) {
			throw new Error(`Users in the selected data wasn't found, it must but at least an empty array for the ${ this.name } importer.`); //TODO: Make translatable
		} else if (importSelection.channels === undefined) {
			throw new Error(`Channels in the selected data wasn't found, it must but at least an empty array for the ${ this.name } importer.`); //TODO: Make translatable
		}

		return this.updateProgress(Importer.ProgressStep.IMPORTING_STARTED);
	}

	// Gets the Importer.Selection object for the import.
	//
	// @return [Importer.Selection] the users and channels selection
	getSelection() {
		throw new Error(`Invalid 'getSelection' called on ${ this.name }, it must be overridden and super can not be called.`);
	}

	// Gets the progress of this importer.
	//
	// @return [Importer.Progress] the progress of the import
	//
	getProgress() {
		return this.progress;
	}

	// Updates the progress step of this importer.
	//
	// @return [Importer.Progress] the progress of the import
	//
	updateProgress(step) {
		this.progress.step = step;

		switch (step) {
			case Importer.ProgressStep.IMPORTING_STARTED:
				this.oldSettings.Accounts_AllowedDomainsList = RocketChat.models.Settings.findOneById('Accounts_AllowedDomainsList').value;
				RocketChat.models.Settings.updateValueById('Accounts_AllowedDomainsList', '');

				this.oldSettings.Accounts_AllowUsernameChange = RocketChat.models.Settings.findOneById('Accounts_AllowUsernameChange').value;
				RocketChat.models.Settings.updateValueById('Accounts_AllowUsernameChange', true);
				break;
			case Importer.ProgressStep.DONE:
			case Importer.ProgressStep.ERROR:
				RocketChat.models.Settings.updateValueById('Accounts_AllowedDomainsList', this.oldSettings.Accounts_AllowedDomainsList);
				RocketChat.models.Settings.updateValueById('Accounts_AllowUsernameChange', this.oldSettings.Accounts_AllowUsernameChange);
				break;
		}

		this.logger.debug(`${ this.name } is now at ${ step }.`);
		this.updateRecord({ 'status': this.progress.step });

		return this.progress;
	}

	// Adds the passed in value to the total amount of items needed to complete.
	//
	// @return [Importer.Progress] the progress of the import
	//
	addCountToTotal(count) {
		this.progress.count.total = this.progress.count.total + count;
		this.updateRecord({ 'count.total': this.progress.count.total });

		return this.progress;
	}

	// Adds the passed in value to the total amount of items completed.
	//
	// @return [Importer.Progress] the progress of the import
	//
	addCountCompleted(count) {
		this.progress.count.completed = this.progress.count.completed + count;

		//Only update the database every 500 records
		//Or the completed is greater than or equal to the total amount
		if (((this.progress.count.completed % 500) === 0) || (this.progress.count.completed >= this.progress.count.total)) {
			this.updateRecord({ 'count.completed': this.progress.count.completed });
		}

		return this.progress;
	}

	// Updates the import record with the given fields being `set`
	//
	// @return [Importer.Imports] the import record object
	//
	updateRecord(fields) {
		Importer.Imports.update({ _id: this.importRecord._id }, { $set: fields });
		this.importRecord = Importer.Imports.findOne(this.importRecord._id);

		return this.importRecord;
	}

	// Uploads the file to the storage.
	//
	// @param [Object] details an object with details about the upload. name, size, type, and rid
	// @param [String] fileUrl url of the file to download/import
	// @param [Object] user the Rocket.Chat user
	// @param [Object] room the Rocket.Chat room
	// @param [Date] timeStamp the timestamp the file was uploaded
	//
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
};
