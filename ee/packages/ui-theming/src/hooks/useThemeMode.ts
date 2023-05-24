import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Returns the current option set by the user, the theme mode resolved given the user configuration and OS (if applies) and a function to set it.
 * @param defaultThemeMode The default theme mode to use if the user has not set any.
 * @returns [currentThemeMode, setThemeMode, resolvedThemeMode]
 */

export const useThemeMode = (): [ThemeMode, (value: ThemeMode) => () => void, 'light' | 'dark'] => {
	const theme = useUserPreference<ThemeMode>('themeAppearence') || 'auto';

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const setTheme = (value: ThemeMode): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { themeAppearence: value } }), [value]);

	return [theme, setTheme, useDarkMode(theme === 'auto' ? undefined : theme === 'dark') ? 'dark' : 'light'];
};
