import { useDarkMode } from '@rocket.chat/fuselage-hooks';

import { useAbsoluteUrl } from './useAbsoluteUrl';
import { useSetting } from './useSetting';
import { useUserPreference } from './useUserPreference';

export const useAssetPath = (assetId: string): string | undefined => {
	const userThemePreference = useUserPreference('themeAppearence') || 'auto';
	const theme = useDarkMode(userThemePreference === 'auto' ? undefined : userThemePreference === 'dark') ? 'dark' : 'light';
	const themeAssetId = theme === 'dark' ? `${assetId}_dark` : assetId;

	const asset = useSetting<{ url?: string; defaultUrl?: string }>(themeAssetId);
	const absoluteUrl = useAbsoluteUrl();

	return (asset?.url ?? asset?.defaultUrl) && absoluteUrl(asset?.url ?? asset?.defaultUrl ?? '');
};
