import { Meteor } from 'meteor/meteor';
import { Importers } from 'meteor/rocketchat:importer';
import { RocketChatFile } from 'meteor/rocketchat:file';
import { RocketChatImportFileInstance } from '../startup/store';

Meteor.methods({
	uploadImportFile(binaryContent, contentType, fileName, importerKey) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'uploadImportFile' });
		}

		if (!RocketChat.authz.hasRole(userId, 'admin')) {
			throw new Meteor.Error('not_authorized', 'User not authorized', { method: 'uploadImportFile' });
		}

		const importer = Importers.get(importerKey);
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', `The importer (${ importerKey }) has no import class defined.`, { method: 'uploadImportFile' });
		}

		const date = new Date();
		const dateStr = `${ date.getUTCFullYear() }${ date.getUTCMonth() }${ date.getUTCDate() }${ date.getUTCHours() }${ date.getUTCMinutes() }${ date.getUTCSeconds() }`;
		const newFileName = `${ dateStr }_${ userId }_${ fileName }`;

		importer.instance.startFileUpload(newFileName, contentType);

		const file = new Buffer(binaryContent, 'binary');
		const readStream = RocketChatFile.bufferToStream(file);
		const writeStream = RocketChatImportFileInstance.createWriteStream(newFileName, contentType);

		readStream.pipe(writeStream);
	},
});
