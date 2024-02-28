import type { IRocketChatAssets } from '@rocket.chat/core-typings';

import { useAbsoluteUrl } from './useAbsoluteUrl';
import { useSetting } from './useSetting';

export const useAssetPath = (assetId: keyof IRocketChatAssets): string | undefined => {
	const asset = useSetting<{ url?: string; defaultUrl?: string }>(`Assets_${assetId}`);
	const absoluteUrl = useAbsoluteUrl();

	return (asset?.url ?? asset?.defaultUrl) && absoluteUrl(asset?.url ?? asset?.defaultUrl ?? '');
};
