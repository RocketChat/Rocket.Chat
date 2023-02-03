import { useDarkMode, useSessionStorage } from '@rocket.chat/fuselage-hooks';
import type { Dispatch, SetStateAction } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Returns the current option set by the user, the theme mode resolved given the user configuration and OS (if applies) and a function to set it.
 * @param defaultThemeMode The default theme mode to use if the user has not set any.
 * @returns [currentThemeMode, setThemeMode, resolvedThemeMode]
 */

export const useThemeMode = (value: ThemeMode = 'auto'): [ThemeMode, Dispatch<SetStateAction<ThemeMode>>, 'light' | 'dark'] => {
	const [theme, setTheme] = useSessionStorage<ThemeMode>(`rcx-theme`, value);

	return [theme, setTheme, useDarkMode(theme === 'auto' ? undefined : theme === 'dark') ? 'dark' : 'light'];
};
