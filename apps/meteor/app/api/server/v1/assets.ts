import { Meteor } from 'meteor/meteor';
import { isAssetsUnsetAssetProps } from '@rocket.chat/rest-typings';

import { RocketChatAssets } from '../../../assets/server';
import { API } from '../api';
import { getUploadFormData } from '../lib/getUploadFormData';

API.v1.addRoute(
	'assets.setAsset',
	{ authRequired: true },
	{
		async post() {
			const [asset, { refreshAllClients, assetName: customName }, fileName] = await getUploadFormData(
				{
					request: this.request,
				},
				{ field: 'asset' },
			);

			const assetName = customName || fileName;
			const assetsKeys = Object.keys(RocketChatAssets.assets);

			const isValidAsset = assetsKeys.includes(assetName);
			if (!isValidAsset) {
				throw new Meteor.Error('error-invalid-asset', 'Invalid asset');
			}

			Meteor.call('setAsset', asset.fileBuffer, asset.mimetype, assetName);
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
