import type { IRocketChatAssets } from '@rocket.chat/core-typings';

export type AssetsEndpoints = {
	'assets.setAsset': {
		POST: (params: { assetName: keyof IRocketChatAssets; refreshAllClients?: boolean }) => void;
	};

	'assets.unsetAsset': {
		POST: (params: { assetName: keyof IRocketChatAssets; refreshAllClients?: boolean }) => void;
	};
};
