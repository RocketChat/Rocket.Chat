import { Meteor } from 'meteor/meteor';
import { isAssetsUnsetAssetProps } from '@rocket.chat/rest-typings';

import { RocketChatAssets } from '../../../assets/server';
import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';
import { settings } from '../../../settings/server';

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

			Meteor.call('setAsset', fileBuffer, mimetype, assetName);
			if (refreshAllClients) {
				Meteor.call('refreshClients');
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
		post() {
			const { assetName, refreshAllClients } = this.bodyParams;
			const isValidAsset = Object.keys(RocketChatAssets.assets).includes(assetName);
			if (!isValidAsset) {
				throw new Meteor.Error('error-invalid-asset', 'Invalid asset');
			}
			Meteor.call('unsetAsset', assetName);
			if (refreshAllClients) {
				Meteor.call('refreshClients');
			}
			return API.v1.success();
		},
	},
);
