import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';
import type { IRocketChatAssets } from '@rocket.chat/core-typings';

export type AssetsUnsetAssetProps = { assetName: keyof IRocketChatAssets; refreshAllClients?: boolean };

export type AssetsEndpoints = {
	'assets.setAsset': {
		POST: (params: AssetsUnsetAssetProps) => void;
	};

	'assets.unsetAsset': {
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

export const isAssetsUnsetAssetProps = ajv.compile(assetsUnsetAssetPropsSchema);
