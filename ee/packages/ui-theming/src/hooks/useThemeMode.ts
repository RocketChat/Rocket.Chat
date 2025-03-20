import type { ThemePreference as ThemeMode, Themes } from '@rocket.chat/core-typings';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

/**
 * Returns the current option set by the user, the theme mode resolved given the user configuration and OS (if applies) and a function to set it.
 * @param defaultThemeMode The default theme mode to use if the user has not set any.
 * @returns [currentThemeMode, setThemeMode, resolvedThemeMode]
 */

export const useThemeMode = (): [ThemeMode, (value: ThemeMode) => () => void, Themes] => {
	const themeMode = useUserPreference<ThemeMode>('themeAppearence') || 'auto';

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const [updaters] = useState(
		(): Record<ThemeMode, () => void> => ({
			'light': () => saveUserPreferences({ data: { themeAppearence: 'light' } }),
			'dark': () => saveUserPreferences({ data: { themeAppearence: 'dark' } }),
			'auto': () => saveUserPreferences({ data: { themeAppearence: 'auto' } }),
			'high-contrast': () => saveUserPreferences({ data: { themeAppearence: 'high-contrast' } }),
		}),
	);

	const setTheme = useCallback((value: ThemeMode): (() => void) => updaters[value], [updaters]);

	const useTheme = () => {
		if (useDarkMode(themeMode === 'auto' ? undefined : themeMode === 'dark')) {
			return 'dark';
		}
		if (themeMode === 'high-contrast') {
			return 'high-contrast';
		}
		return 'light';
	};
	return [themeMode, setTheme, useTheme()];
};
