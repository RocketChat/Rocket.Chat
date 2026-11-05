import type { IRocketChatAssets, ISettingAsset } from '@rocket.chat/core-typings';

import { useAbsoluteUrl } from './useAbsoluteUrl.js';
import { useSetting } from './useSetting.js';

export const useAssetPath = (assetId: keyof IRocketChatAssets): string | undefined => {
	const asset = useSetting<ISettingAsset>(`Assets_${assetId}`);
	const absoluteUrl = useAbsoluteUrl();

	return (asset?.url ?? asset?.defaultUrl) && absoluteUrl(asset?.url ?? asset?.defaultUrl ?? '');
};
