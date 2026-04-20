import { Settings } from '@rocket.chat/models';
import {
	ajv,
	isAssetsUnsetAssetProps,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';

import { updateAuditedByUser } from '../../../../server/settings/lib/auditedSettingUpdates';
import { RocketChatAssets, refreshClients } from '../../../assets/server';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
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
