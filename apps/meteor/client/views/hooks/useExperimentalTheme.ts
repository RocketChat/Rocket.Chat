import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

import { useThemeShortcut } from './useThemeShortcut';

export const useExperimentalTheme = (): boolean => {
	const [value, setValue] = useSessionStorage('rc-experimental-theme', false);

	useThemeShortcut(
		'ArrowUp ArrowDown ArrowUp ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight T',
		useCallback(() => {
			setValue((value) => !value);
		}, [setValue]),
	);

	return value;
};

export const useIsExperimentalThemeEnabled = (): boolean => {
	const [value] = useSessionStorage('rc-experimental-theme', false);
	return value;
};
