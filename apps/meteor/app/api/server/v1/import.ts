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

import { Importers } from '../../../importer/server';
import {
	executeUploadImportFile,
	executeDownloadPublicImportFile,
	executeGetImportProgress,
	executeGetImportFileData,
	executeStartImport,
	executeGetLatestImportOperations,
} from '../../../importer/server/methods';
import { PendingAvatarImporter } from '../../../importer-pending-avatars/server/PendingAvatarImporter';
import { PendingFileImporter } from '../../../importer-pending-files/server/PendingFileImporter';
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
