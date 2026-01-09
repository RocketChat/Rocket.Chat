import { readFile } from 'fs/promises';

import { Settings } from '@rocket.chat/models';
import { isAssetsUnsetAssetProps } from '@rocket.chat/rest-typings';

import { updateAuditedByUser } from '../../../../server/settings/lib/auditedSettingUpdates';
import { RocketChatAssets, refreshClients } from '../../../assets/server';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { API } from '../api';
import { UploadService } from '../lib/UploadService';

API.v1.addRoute(
	'assets.setAsset',
	{
		authRequired: true,
		permissionsRequired: ['manage-assets'],
	},
	{
		async post() {
			const { file, fields } = await UploadService.parse(this.request, {
				field: 'asset',
				maxSize: settings.get<number>('FileUpload_MaxFileSize'),
			});

			if (!file) {
				throw new Error('No file was uploaded');
			}

			const { refreshAllClients, assetName: customName } = fields;

			const assetName = customName || file.filename;
			const assetsKeys = Object.keys(RocketChatAssets.assets);

			const isValidAsset = assetsKeys.includes(assetName);
			if (!isValidAsset) {
				throw new Error('Invalid asset');
			}

			const fileBuffer = await readFile(file.tempFilePath);
			const { key, value } = await RocketChatAssets.setAssetWithBuffer(fileBuffer, file.mimetype, assetName);

			const { modifiedCount } = await updateAuditedByUser({
				_id: this.userId,
				username: this.user.username!,
				ip: this.requestIp,
				useragent: this.request.headers.get('user-agent') || '',
			})(Settings.updateValueById, key, value);

			if (modifiedCount) {
				void notifyOnSettingChangedById(key);
			}

			if (refreshAllClients) {
				await refreshClients(this.userId);
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'assets.unsetAsset',
	{
		authRequired: true,
		validateParams: isAssetsUnsetAssetProps,
		permissionsRequired: ['manage-assets'],
	},
	{
		async post() {
			const { assetName, refreshAllClients } = this.bodyParams;
			const isValidAsset = Object.keys(RocketChatAssets.assets).includes(assetName);
			if (!isValidAsset) {
				throw Error('Invalid asset');
			}

			const { key, value } = await RocketChatAssets.unsetAsset(assetName);

			const { modifiedCount } = await updateAuditedByUser({
				_id: this.userId,
				username: this.user.username!,
				ip: this.requestIp,
				useragent: this.request.headers.get('user-agent') || '',
			})(Settings.updateValueById, key, value);

			if (modifiedCount) {
				void notifyOnSettingChangedById(key);
			}

			if (refreshAllClients) {
				await refreshClients(this.userId);
			}
			return API.v1.success();
		},
	},
);
