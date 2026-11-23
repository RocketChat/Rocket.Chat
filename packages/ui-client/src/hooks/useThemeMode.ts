import type { ThemePreference as ThemeMode } from '@rocket.chat/core-typings';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { useUserPreference } from '@rocket.chat/ui-contexts';

import { usePreviewedThemePreference } from './useThemePreview.js';

/**
 * Returns the resolved theme string based on the user's theme appearance preference (or the one being previewed) and system dark-mode setting.
 */
export const useThemeMode = () => {
	const savedThemeMode = useUserPreference<ThemeMode>('themeAppearence') || 'auto';
	const themeMode = usePreviewedThemePreference() ?? savedThemeMode;
	const isDarkMode = useDarkMode(themeMode === 'auto' ? undefined : themeMode === 'dark');

	if (isDarkMode) {
		return 'dark';
	}

	if (themeMode === 'high-contrast') {
		return 'high-contrast';
	}

	return 'light';
};
