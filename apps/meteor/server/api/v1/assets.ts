import { Settings } from '@rocket.chat/models';
import {
	ajv,
	isAssetsUnsetAssetProps,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';

import { assetsExamples } from './assets.examples';
import { RocketChatAssets, refreshClients } from '../../lib/media/assets';
import { notifyOnSettingChangedById } from '../../lib/notifyListener';
import { settings } from '../../settings';
import { updateAuditedByUser } from '../../settings/lib/auditedSettingUpdates';
import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

API.v1.post(
	'assets.setAsset',
	{
		summary: 'Set Asset',
		description: `Upload an <a href="https://docs.rocket.chat/docs/assets" target="_blank"> asset</a> by name. Permissions required: \`manage-assets\`. Make sure that the workspace's <a href='https://docs.rocket.chat/docs/file-upload' target='_blank'>file upload settings</a> are configured as required. The allowed file size and type depend on the file upload settings.

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|0.69.0           | Added       |`,
		examples: assetsExamples['assets.setAsset'],
		tags: ['Assets'],
		authRequired: true,
		permissionsRequired: ['manage-assets'],
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const asset = await getUploadFormData(
			{
				request: this.request,
			},
			{ field: 'asset', sizeLimit: settings.get('FileUpload_MaxFileSize') },
		);

		const { fileBuffer, fields, filename, mimetype } = asset;

		const { refreshAllClients, assetName: customName } = fields;

		const assetName = customName || filename;
		const assetsKeys = Object.keys(RocketChatAssets.assets);

		const isValidAsset = assetsKeys.includes(assetName);
		if (!isValidAsset) {
			throw new Error('Invalid asset');
		}

		const { key, value } = await RocketChatAssets.setAssetWithBuffer(fileBuffer, mimetype, assetName);

		const { modifiedCount } = await updateAuditedByUser({
			_id: this.userId,
			username: this.user.username ?? '',
			ip: this.requestIp ?? '',
			useragent: this.request.headers.get('user-agent') ?? '',
		})(Settings.updateValueById, key, value);

		if (modifiedCount) {
			void notifyOnSettingChangedById(key);
		}

		if (refreshAllClients) {
			await refreshClients(this.userId);
		}

		return API.v1.success();
	},
);

API.v1.post(
	'assets.unsetAsset',
	{
		summary: 'Unset Asset',
		description: `Remove an asset by name. Permissions required: \`manage-assets\` .

### Changelog
| Version      | Description | 
| ---------------- | ------------|
|0.69.0           | Added       |`,
		examples: assetsExamples['assets.unsetAsset'],
		tags: ['Assets'],
		authRequired: true,
		body: isAssetsUnsetAssetProps,
		permissionsRequired: ['manage-assets'],
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { assetName, refreshAllClients } = this.bodyParams;
		const isValidAsset = Object.keys(RocketChatAssets.assets).includes(assetName);
		if (!isValidAsset) {
			throw Error('Invalid asset');
		}

		const { key, value } = await RocketChatAssets.unsetAsset(assetName);

		const { modifiedCount } = await updateAuditedByUser({
			_id: this.userId,
			username: this.user.username ?? '',
			ip: this.requestIp ?? '',
			useragent: this.request.headers.get('user-agent') ?? '',
		})(Settings.updateValueById, key, value);

		if (modifiedCount) {
			void notifyOnSettingChangedById(key);
		}

		if (refreshAllClients) {
			await refreshClients(this.userId);
		}
		return API.v1.success();
	},
);
