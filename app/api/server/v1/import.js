import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { hasPermission } from '../../../authorization/server';
import { Imports } from '../../../models/server';
import { Importers } from '../../../importer/server';

API.v1.addRoute(
	'uploadImportFile',
	{ authRequired: true },
	{
		post() {
			const { binaryContent, contentType, fileName, importerKey } = this.bodyParams;

			return API.v1.success(Meteor.call('uploadImportFile', binaryContent, contentType, fileName, importerKey));
		},
	},
);

API.v1.addRoute(
	'downloadPublicImportFile',
	{ authRequired: true },
	{
		post() {
			const { fileUrl, importerKey } = this.bodyParams;

			Meteor.runAsUser(this.userId, () => {
				API.v1.success(Meteor.call('downloadPublicImportFile', fileUrl, importerKey));
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'startImport',
	{ authRequired: true },
	{
		post() {
			const { input } = this.bodyParams;

			Meteor.runAsUser(this.userId, () => {
				API.v1.success(Meteor.call('startImport', input));
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'getImportFileData',
	{ authRequired: true },
	{
		get() {
			let result;
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('getImportFileData');
			});

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'getImportProgress',
	{ authRequired: true },
	{
		get() {
			let result;
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('getImportProgress');
			});

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'getLatestImportOperations',
	{ authRequired: true },
	{
		get() {
			let result;
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('getLatestImportOperations');
			});

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'downloadPendingFiles',
	{ authRequired: true },
	{
		post() {
			if (!this.userId) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'downloadPendingFiles',
				});
			}

			if (!hasPermission(this.userId, 'run-import')) {
				throw new Meteor.Error('not_authorized');
			}

			const importer = Importers.get('pending-files');
			if (!importer) {
				throw new Meteor.Error('error-importer-not-defined', 'The Pending File Importer was not found.', {
					method: 'downloadPendingFiles',
				});
			}

			importer.instance = new importer.importer(importer); // eslint-disable-line new-cap
			const count = importer.instance.prepareFileCount();

			return API.v1.success({
				success: true,
				count,
			});
		},
	},
);

API.v1.addRoute(
	'downloadPendingAvatars',
	{ authRequired: true },
	{
		post() {
			if (!this.userId) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'downloadPendingAvatars',
				});
			}

			if (!hasPermission(this.userId, 'run-import')) {
				throw new Meteor.Error('not_authorized');
			}

			const importer = Importers.get('pending-avatars');
			if (!importer) {
				throw new Meteor.Error('error-importer-not-defined', 'The Pending File Importer was not found.', {
					method: 'downloadPendingAvatars',
				});
			}

			importer.instance = new importer.importer(importer); // eslint-disable-line new-cap
			const count = importer.instance.prepareFileCount();

			return API.v1.success({
				success: true,
				count,
			});
		},
	},
);

API.v1.addRoute(
	'getCurrentImportOperation',
	{ authRequired: true },
	{
		get() {
			if (!this.userId) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'getCurrentImportOperation',
				});
			}

			if (!hasPermission(this.userId, 'run-import')) {
				throw new Meteor.Error('not_authorized');
			}

			const operation = Imports.findLastImport();
			return API.v1.success({
				success: true,
				operation,
			});
		},
	},
);
