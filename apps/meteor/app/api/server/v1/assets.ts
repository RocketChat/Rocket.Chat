import { isAssetsUnsetAssetProps } from '@rocket.chat/rest-typings';

import { RocketChatAssets, setAsset, unsetAsset, refreshClients } from '../../../assets/server';
import { settings } from '../../../settings/server';
import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';

API.v1.addRoute(
	'assets.setAsset',
	{ authRequired: true },
	{
		async post() {
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

			await setAsset(this.userId, fileBuffer, mimetype, assetName);
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
	},
	{
		async post() {
			const { assetName, refreshAllClients } = this.bodyParams;
			const isValidAsset = Object.keys(RocketChatAssets.assets).includes(assetName);
			if (!isValidAsset) {
				throw Error('Invalid asset');
			}
			await unsetAsset(this.userId, assetName);
			if (refreshAllClients) {
				await refreshClients(this.userId);
			}
			return API.v1.success();
		},
	},
);
