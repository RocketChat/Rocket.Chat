import { Import } from '@rocket.chat/core-services';
import type { IImport } from '@rocket.chat/core-typings';
import { Imports } from '@rocket.chat/models';
import {
	ajv,
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
	isImportAddUsersParamsPOST,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { importExamples } from './import.examples';
import { Importers } from '../../lib/import';
import { PendingAvatarImporter } from '../../lib/import/pending-avatars/PendingAvatarImporter';
import { PendingFileImporter } from '../../lib/import/pending-files/PendingFileImporter';
import { executeDownloadPublicImportFile } from '../../meteor-methods/import/downloadPublicImportFile';
import { executeGetImportFileData } from '../../meteor-methods/import/getImportFileData';
import { executeGetImportProgress } from '../../meteor-methods/import/getImportProgress';
import { executeGetLatestImportOperations } from '../../meteor-methods/import/getLatestImportOperations';
import { executeStartImport } from '../../meteor-methods/import/startImport';
import { executeUploadImportFile } from '../../meteor-methods/import/uploadImportFile';
import { API } from '../api';

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const uploadImportFileResponseSchema = ajv.compile<void>({
	type: 'object',
	additionalProperties: true,
});

const countResponseSchema = ajv.compile<{ count: number }>({
	type: 'object',
	properties: {
		count: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['count', 'success'],
	additionalProperties: false,
});

const operationResponseSchema = ajv.compile<{ operation: IImport | undefined }>({
	type: 'object',
	properties: {
		operation: { $ref: '#/components/schemas/IImport' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const importersListResponseSchema = ajv.compile<Array<{ key: string; name: string }>>({
	type: 'array',
	items: { type: 'object', properties: { key: { type: 'string' }, name: { type: 'string' } } },
});

API.v1.post(
	'uploadImportFile',
	{
		summary: 'Upload Import File',
		description: `This endpoint takes in the binary content of the imported file, along with additional information about its content, and stores it in a buffer. Permission required: \`run-import\`.

### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.0.0            | Added       |`,
		examples: importExamples.uploadImportFile,
		authRequired: true,
		permissionsRequired: ['run-import'],
		body: isUploadImportFileParamsPOST,
		response: {
			200: uploadImportFileResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { binaryContent, contentType, fileName, importerKey } = this.bodyParams;

		await executeUploadImportFile(this.userId, binaryContent, contentType, fileName, importerKey);

		return API.v1.success();
	},
);

API.v1.post(
	'downloadPublicImportFile',
	{
		summary: 'Download Public Import File',
		description: `Download the public import file.
Permission required: \`run-import\`

### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.0.0            | Added       |`,
		examples: importExamples.downloadPublicImportFile,
		authRequired: true,
		permissionsRequired: ['run-import'],
		body: isDownloadPublicImportFileParamsPOST,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { fileUrl, importerKey } = this.bodyParams;
		await executeDownloadPublicImportFile(this.userId, fileUrl, importerKey);

		return API.v1.success();
	},
);

API.v1.post(
	'startImport',
	{
		summary: 'Start Import',
		description: `Triggers the process of importing users, rooms and messages to the workspace.
Permission required: \`run-import\`

### Changelog
| Version      | Description |
| ---------------- | ------------|
|7.0.0            | Remove required extra data from \`users\` and \`channels\` parameters. Use only record ID of the users or channels.   |
|3.0.0            | Added       |`,
		examples: importExamples.startImport,
		authRequired: true,
		permissionsRequired: ['run-import'],
		body: isStartImportParamsPOST,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { input } = this.bodyParams;

		await executeStartImport({ input }, this.userId);

		return API.v1.success();
	},
);

API.v1.get(
	'getImportFileData',
	{
		summary: 'Get Import File Data',
		description: `Get the import file data.
Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.0.0            | Added       |`,
		examples: importExamples.getImportFileData,
		authRequired: true,
		permissionsRequired: ['run-import'],
		query: isGetImportFileDataParamsGET,
		response: {
			200: ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true }),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const result = await executeGetImportFileData();

		return API.v1.success(typeof result === 'object' ? result : {});
	},
);

API.v1.get(
	'getImportProgress',
	{
		summary: 'Get Import Progress',
		description: `Get the progress of the import.
Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.0.0            | Added       |`,
		examples: importExamples.getImportProgress,
		authRequired: true,
		permissionsRequired: ['run-import'],
		query: isGetImportProgressParamsGET,
		response: {
			200: ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true }),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const result = await executeGetImportProgress();

		return API.v1.success(typeof result === 'object' ? result : {});
	},
);

API.v1.get(
	'getLatestImportOperations',
	{
		summary: 'Get Latest Import Operations',
		description: `Get latests import operations.
Permission required: \`view-import-operations\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.0.0            | Added       |`,
		examples: importExamples.getLatestImportOperations,
		authRequired: true,
		permissionsRequired: ['view-import-operations'],
		query: isGetLatestImportOperationsParamsGET,
		response: {
			200: ajv.compile<Array<IImport>>({
				type: 'array',
				items: {
					type: 'object',
				},
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const operations = await executeGetLatestImportOperations();

		return API.v1.success(operations);
	},
);

API.v1.post(
	'downloadPendingFiles',
	{
		summary: 'Download Pending Files',
		description: `Dowbload pending files.
Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.0.0            | Added       |`,
		examples: importExamples.downloadPendingFiles,
		authRequired: true,
		permissionsRequired: ['run-import'],
		body: isDownloadPendingFilesParamsPOST,
		response: {
			200: countResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const importer = Importers.get('pending-files');
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', 'The Pending File Importer was not found.', 'downloadPendingFiles');
		}

		const operation = await Import.newOperation(this.userId, importer.name, importer.key);
		const instance = new PendingFileImporter(importer, operation);
		const count = await instance.prepareFileCount();

		return API.v1.success({
			count,
		});
	},
);

API.v1.post(
	'downloadPendingAvatars',
	{
		summary: 'Download Pending Avatars',
		description: `Download pending avatars from the import.
Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.0.0            | Added       |`,
		examples: importExamples.downloadPendingAvatars,
		authRequired: true,
		permissionsRequired: ['run-import'],
		body: isDownloadPendingAvatarsParamsPOST,
		response: {
			200: countResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const importer = Importers.get('pending-avatars');
		if (!importer) {
			throw new Meteor.Error('error-importer-not-defined', 'The Pending File Importer was not found.', 'downloadPendingAvatars');
		}

		const operation = await Import.newOperation(this.userId, importer.name, importer.key);
		const instance = new PendingAvatarImporter(importer, operation);
		const count = await instance.prepareFileCount();

		return API.v1.success({
			count,
		});
	},
);

API.v1.get(
	'getCurrentImportOperation',
	{
		summary: 'Get Current Import Operations',
		description: `Get the current import operation.
Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|3.0.0            | Added       |`,
		examples: importExamples.getCurrentImportOperation,
		authRequired: true,
		permissionsRequired: ['run-import'],
		query: isGetCurrentImportOperationParamsGET,
		response: {
			200: operationResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const operation = await Imports.findLastImport();

		return API.v1.success({
			operation,
		});
	},
);

API.v1.get(
	'importers.list',
	{
		summary: 'Get List of Imports',
		description: `Use this endpoint to view the list of imports in the workspace. Permission required: \`run-import\``,
		examples: importExamples['importers.list'],
		authRequired: true,
		permissionsRequired: ['run-import'],
		query: isImportersListParamsGET,
		response: {
			200: importersListResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const importers = Importers.getAllVisible().map(({ key, name }) => ({ key, name }));

		return API.v1.success(importers);
	},
);

API.v1.post(
	'import.clear',
	{
		summary: 'Abort Import Operation',
		description: `Abort any import operation currently in progress. Clear any remaining data that may have been left by any previous operation.
Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|6.3.0            | Added       |`,
		authRequired: true,
		permissionsRequired: ['run-import'],
		response: {
			200: successResponseSchema,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		await Import.clear();

		return API.v1.success();
	},
);

API.v1.post(
	'import.new',
	{
		summary: 'Create New Import Operation',
		description: `Creates a new import operation; if an operation was already running, it will be aborted. Any data from previous imports will be cleared automatically.
Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|6.3.0            | Added       |`,
		examples: importExamples['import.new'],
		authRequired: true,
		permissionsRequired: ['run-import'],
		response: {
			200: operationResponseSchema,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const operation = await Import.newOperation(this.userId, 'api', 'api');

		return API.v1.success({ operation });
	},
);

API.v1.get(
	'import.status',
	{
		summary: 'Get Import Operation Status',
		description: `Get the status of the current import operation.Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|6.3.0            | Added       |`,
		examples: importExamples['import.status'],
		authRequired: true,
		permissionsRequired: ['run-import'],
		response: {
			200: ajv.compile<Record<string, unknown>>({ type: 'object', additionalProperties: true }),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const status = await Import.status();

		return API.v1.success(typeof status === 'object' ? status : {});
	},
);

API.v1.post(
	'import.addUsers',
	{
		summary: 'Add Users',
		description: `Adds user data to the import staging area. It requires the current import operation status to be either \`new\` or \`ready\`. If successful, it changes the operation state to \`ready\`.
Permission required: \`run-import\`
### Changelog
| Version      | Description |
| ---------------- | ------------|
|6.3.0            | Added       |`,
		examples: importExamples['import.addUsers'],
		authRequired: true,
		permissionsRequired: ['run-import'],
		body: isImportAddUsersParamsPOST,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { users } = this.bodyParams;

		await Import.addUsers(users);

		return API.v1.success();
	},
);

API.v1.post(
	'import.run',
	{
		summary: 'Run Import Operation',
		description: `Process the data from the current import operation, creating the users on Rocket.Chat. It requires the current import operation state to be \`ready\` and it changes the operation state to \`importing\`. It will return success if the conditions to start the process are met, without waiting for the import to finish.
Permission required: \`run-import\`

1. If a user can not be imported successfully it'll be flagged but the operation will not stop.
2. If a user's email or username is already in use, it will not be created.
3. Only the users that were imported successfully will be removed from the staging area.

### Changelog
| Version      | Description |
| ---------------- | ------------|
|6.3.0            | Added       |`,
		authRequired: true,
		permissionsRequired: ['run-import'],
		response: {
			200: successResponseSchema,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		await Import.run(this.userId);

		return API.v1.success();
	},
);
