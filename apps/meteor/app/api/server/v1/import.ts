import { Meteor } from 'meteor/meteor';
import {
	isUploadImportFileParamsPOST,
	isDownloadPublicImportFileParamsPOST,
	isStartImportParamsPOST,
	isGetImportFileDataParamsGET,
	isGetImportProgressParamsGET,
	isGetLatestImportOperationsParamsGET,
	isDownloadPendingFilesParamsPOST,
	isDownloadPendingAvatarsParamsPOST,
	isGetCurrentImportOperationParamsGET,
} from '@rocket.chat/rest-typings';

import { API } from '../api';
import { Imports } from '../../../models/server';
import { Importers } from '../../../importer/server';
import { executeUploadImportFile } from '../../../importer/server/methods/uploadImportFile';

API.v1.addRoute(
	'uploadImportFile',
	{
		authRequired: true,
		validateParams: isUploadImportFileParamsPOST,
	},
	{
		post() {
			const { binaryContent, contentType, fileName, importerKey } = this.bodyParams;

			return API.v1.success(executeUploadImportFile(this.userId, binaryContent, contentType, fileName, importerKey));
		},
	},
);

API.v1.addRoute(
	'downloadPublicImportFile',
	{
		authRequired: true,
		validateParams: isDownloadPublicImportFileParamsPOST,
	},
	{
		post() {
			const { fileUrl, importerKey } = this.bodyParams;

			Meteor.call('downloadPublicImportFile', fileUrl, importerKey);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'startImport',
	{
		authRequired: true,
		validateParams: isStartImportParamsPOST,
	},
	{
		post() {
			const { input } = this.bodyParams;

			Meteor.call('startImport', input);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'getImportFileData',
	{
		authRequired: true,
		validateParams: isGetImportFileDataParamsGET,
	},
	{
		get() {
			const result = Meteor.call('getImportFileData');
			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'getImportProgress',
	{
		authRequired: true,
		validateParams: isGetImportProgressParamsGET,
	},
	{
		get() {
			const result = Meteor.call('getImportProgress');
			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'getLatestImportOperations',
	{
		authRequired: true,
		validateParams: isGetLatestImportOperationsParamsGET,
	},
	{
		get() {
			const result = Meteor.call('getLatestImportOperations');
			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'downloadPendingFiles',
	{
		authRequired: true,
		validateParams: isDownloadPendingFilesParamsPOST,
		permissionsRequired: ['run-import'],
	},
	{
		post() {
			const importer = Importers.get('pending-files');
			if (!importer) {
				throw new Meteor.Error('error-importer-not-defined', 'The Pending File Importer was not found.', {
					method: 'downloadPendingFiles',
				});
			}

			importer.instance = new importer.importer(importer); // eslint-disable-line new-cap
			const count = importer.instance.prepareFileCount();

			return API.v1.success({
				count,
			});
		},
	},
);

API.v1.addRoute(
	'downloadPendingAvatars',
	{
		authRequired: true,
		validateParams: isDownloadPendingAvatarsParamsPOST,
		permissionsRequired: ['run-import'],
	},
	{
		post() {
			const importer = Importers.get('pending-avatars');
			if (!importer) {
				throw new Meteor.Error('error-importer-not-defined', 'The Pending File Importer was not found.', {
					method: 'downloadPendingAvatars',
				});
			}

			importer.instance = new importer.importer(importer); // eslint-disable-line new-cap
			const count = importer.instance.prepareFileCount();

			return API.v1.success({
				count,
			});
		},
	},
);

API.v1.addRoute(
	'getCurrentImportOperation',
	{
		authRequired: true,
		validateParams: isGetCurrentImportOperationParamsGET,
		permissionsRequired: ['run-import'],
	},
	{
		get() {
			const operation = Imports.findLastImport();
			return API.v1.success({
				success: true,
				operation,
			});
		},
	},
);
