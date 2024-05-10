import { isAssetsUnsetAssetProps } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { RocketChatAssets } from '../../../assets/server';
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
				throw new Meteor.Error('error-invalid-asset', 'Invalid asset');
			}

			await Meteor.callAsync('setAsset', fileBuffer, mimetype, assetName);
			if (refreshAllClients) {
				await Meteor.callAsync('refreshClients');
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
				throw new Meteor.Error('error-invalid-asset', 'Invalid asset');
			}
			await Meteor.callAsync('unsetAsset', assetName);
			if (refreshAllClients) {
				await Meteor.callAsync('refreshClients');
			}
			return API.v1.success();
		},
	},
);
