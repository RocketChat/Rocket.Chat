import { useAbsoluteUrl, useSetting } from '@rocket.chat/ui-contexts';

type Asset = { url?: string; defaultUrl?: string };

export const useAssetPath = (assetId: string): string | undefined => {
	const asset = useSetting<Asset>(assetId);
	const absoluteUrl = useAbsoluteUrl();

	const url = (asset?.url ?? asset?.defaultUrl) && absoluteUrl(asset?.url ?? asset?.defaultUrl ?? '');

	return url;
};
