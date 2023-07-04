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
	isImportersListParamsGET,
} from '@rocket.chat/rest-typings';
import { Imports } from '@rocket.chat/models';

import { API } from '../api';
import { Importers } from '../../../importer/server';
import { startImportOperation } from '../../../importer/server/startImportOperation';
import { PendingFileImporter } from '../../../importer-pending-files/server/importer';
import { PendingAvatarImporter } from '../../../importer-pending-avatars/server/importer';
import {
	executeUploadImportFile,
	executeDownloadPublicImportFile,
	executeGetImportProgress,
	executeGetImportFileData,
	executeStartImport,
	executeGetLatestImportOperations,
} from '../../../importer/server/methods';
import { translateForUserId } from '../../../../server/lib/translateForUser';

API.v1.addRoute(
	'uploadImportFile',
	{
		authRequired: true,
		validateParams: isUploadImportFileParamsPOST,
	},
	{
		async post() {
			const { binaryContent, contentType, fileName, importerKey } = this.bodyParams;

			return API.v1.success(await executeUploadImportFile(this.userId, binaryContent, contentType, fileName, importerKey));
		},
	},
);

API.v1.addRoute(
	'downloadPublicImportFile',
	{
		authRequired: true,
		validateParams: isDownloadPublicImportFileParamsPOST,
		permissionsRequired: ['run-import'],
	},
	{
		async post() {
			const { fileUrl, importerKey } = this.bodyParams;
			await executeDownloadPublicImportFile(this.userId, fileUrl, importerKey);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'startImport',
	{
		authRequired: true,
		validateParams: isStartImportParamsPOST,
		permissionsRequired: ['run-import'],
	},
	{
		async post() {
			const { input } = this.bodyParams;

			await executeStartImport({ input });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'getImportFileData',
	{
		authRequired: true,
		validateParams: isGetImportFileDataParamsGET,
		permissionsRequired: ['run-import'],
	},
	{
		async get() {
			const result = await executeGetImportFileData();

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'getImportProgress',
	{
		authRequired: true,
		validateParams: isGetImportProgressParamsGET,
		permissionsRequired: ['run-import'],
	},
	{
		async get() {
			const result = await executeGetImportProgress();
			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'getLatestImportOperations',
	{
		authRequired: true,
		validateParams: isGetLatestImportOperationsParamsGET,
		permissionsRequired: ['view-import-operations'],
	},
	{
		async get() {
			const result = await executeGetLatestImportOperations();
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
		async post() {
			const importer = Importers.get('pending-files');
			if (!importer) {
				throw new Meteor.Error('error-importer-not-defined', 'The Pending File Importer was not found.', 'downloadPendingFiles');
			}

			const operation = await startImportOperation(importer, this.userId);
			const instance = new PendingFileImporter(importer, operation); // eslint-disable-line new-cap
			const count = await instance.prepareFileCount();

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
		async post() {
			const importer = Importers.get('pending-avatars');
			if (!importer) {
				throw new Meteor.Error('error-importer-not-defined', 'The Pending File Importer was not found.', 'downloadPendingAvatars');
			}

			const operation = await startImportOperation(importer, this.userId);
			const instance = new PendingAvatarImporter(importer, operation); // eslint-disable-line new-cap
			const count = await instance.prepareFileCount();

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
		async get() {
			const operation = await Imports.findLastImport();
			return API.v1.success({
				operation,
			});
		},
	},
);

API.v1.addRoute(
	'importers.list',
	{
		authRequired: true,
		validateParams: isImportersListParamsGET,
		permissionsRequired: ['run-import'],
	},
	{
		async get() {
			const importers = Importers.getAllVisible();

			const translatedImporters = await Promise.all(
				importers.map(async ({ key, name }) => ({
					key,
					name: (await translateForUserId(name, this.userId)) || name,
				})),
			);

			return API.v1.success(translatedImporters);
		},
	},
);
