import type { ThemePreference as ThemeMode, Themes } from '@rocket.chat/core-typings';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { useMemo, useContext } from 'react';

import { useThemeMode } from './useThemeMode';
import { ThemePreviewContext } from '../providers/ThemePreviewProvider';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = (): void => {};

export const useThemePreview = (): {
	previewTheme: ThemeMode | undefined;
	resolvedPreviewTheme: Themes;
	setPreviewTheme: (theme: ThemeMode) => void;
	clearPreviewTheme: () => void;
} => {
	const context = useContext(ThemePreviewContext);
	const [savedThemeMode] = useThemeMode();
	const effectiveTheme = context?.previewTheme ?? savedThemeMode;
	const isDarkMode = useDarkMode(effectiveTheme === 'auto' ? undefined : effectiveTheme === 'dark');

	const resolvedPreviewTheme = useMemo((): Themes => {
		if (effectiveTheme === 'high-contrast') {
			return 'high-contrast';
		}

		if (isDarkMode) {
			return 'dark';
		}
		return 'light';
	}, [isDarkMode, effectiveTheme]);

	return {
		previewTheme: context?.previewTheme,
		resolvedPreviewTheme,
		setPreviewTheme: context?.setPreviewTheme ?? NOOP,
		clearPreviewTheme: context?.clearPreviewTheme ?? NOOP,
	};
};
