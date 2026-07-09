import type { ThemePreference as ThemeMode } from '@rocket.chat/core-typings';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { useUserPreference } from '@rocket.chat/ui-contexts';

/**
 * Returns the current option set by the user, the theme mode resolved given the user configuration and OS (if applies) and a function to set it.
 * @param defaultThemeMode The default theme mode to use if the user has not set any.
 */
export const useThemeMode = () => {
	const themeMode = useUserPreference<ThemeMode>('themeAppearence') || 'auto';
	const isDarkMode = useDarkMode(themeMode === 'auto' ? undefined : themeMode === 'dark');

	if (isDarkMode) {
		return 'dark';
	}

	if (themeMode === 'high-contrast') {
		return 'high-contrast';
	}

	return 'light';
};
