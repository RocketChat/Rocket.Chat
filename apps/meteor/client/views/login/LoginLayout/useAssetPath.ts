import type { ISetting } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

type Asset = { url?: string; defaultUrl?: string };

export const useAssetPath = (assetId: ISetting['_id']): string | undefined => {
	const asset = useSetting(assetId) as Asset | undefined;

	const prefix = window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX ?? '';
	const url = asset?.url ?? asset?.defaultUrl;

	return url ? `${prefix}/${url}` : undefined;
};
