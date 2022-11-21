import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';
import type { IRocketChatAssets } from '@rocket.chat/core-typings';

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

const ajv = new Ajv();

const assetsUnsetAssetPropsSchema: JSONSchemaType<AssetsUnsetAssetProps> = {
	type: 'object',
	properties: {
		assetName: { type: 'string' },
		refreshAllClients: { type: 'boolean', nullable: true },
	},
	required: ['assetName'],
	additionalProperties: false,
};

const assetsSetAssetPropsSchema: JSONSchemaType<AssetsSetAssetProps> = {
	type: 'object',
	properties: {
		assetName: { type: 'string' },
		asset: { type: 'string' },
		refreshAllClients: { type: 'boolean', nullable: true },
	},
	required: ['assetName'],
	additionalProperties: false,
};

export const isAssetsUnsetAssetProps = ajv.compile(assetsUnsetAssetPropsSchema);

export const isAssetsSetAssetProps = ajv.compile(assetsSetAssetPropsSchema);
