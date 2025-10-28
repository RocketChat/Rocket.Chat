import type { IRocketChatAssets } from '@rocket.chat/core-typings';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';

import { useAssetPath } from './useAssetPath';
import { useUserPreference } from './useUserPreference';

export const useAssetWithDarkModePath = <A extends keyof IRocketChatAssets>(
	assetId: A extends `${infer T}_dark` ? T : never,
): string | undefined => {
	const userThemePreference = useUserPreference('themeAppearence') || 'auto';
	const theme = useDarkMode(userThemePreference === 'auto' ? undefined : userThemePreference === 'dark') ? 'dark' : 'light';
	const themeAssetId = theme === 'dark' ? (`${assetId}_dark` as const) : assetId;

	return useAssetPath(themeAssetId);
};
