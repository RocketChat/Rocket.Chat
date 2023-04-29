import type { IRocketChatAssets } from '@rocket.chat/core-typings';

import { ajv } from '../helpers/schemas';

export type AssetsUnsetAssetProps = { assetName: keyof IRocketChatAssets; refreshAllClients?: boolean };

export type AssetsSetAssetProps = { asset: string | ArrayBuffer; assetName: keyof IRocketChatAssets; refreshAllClients?: boolean };

export type AssetsEndpoints = {
	'/v1/assets.setAsset': {
		POST: (params: AssetsSetAssetProps) => void;
	};

	'/v1/assets.unsetAsset': {
		POST: (params: AssetsUnsetAssetProps) => void;
	};
};

const assetsUnsetAssetPropsSchema = {
	type: 'object',
	properties: {
		assetName: { type: 'string' },
		refreshAllClients: { type: 'boolean', nullable: true },
	},
	required: ['assetName'],
	additionalProperties: false,
};

const assetsSetAssetPropsSchema = {
	type: 'object',
	properties: {
		assetName: { type: 'string' },
		asset: { type: 'string' },
		refreshAllClients: { type: 'boolean', nullable: true },
	},
	required: ['assetName'],
	additionalProperties: false,
};

export const isAssetsUnsetAssetProps = ajv.compile<AssetsUnsetAssetProps>(assetsUnsetAssetPropsSchema);

export const isAssetsSetAssetProps = ajv.compile<AssetsSetAssetProps>(assetsSetAssetPropsSchema);
