import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

import { useThemeShortcut } from './useThemeShortcut';

export const useExperimentalTheme = (): boolean => {
	const [value, setValue] = useSessionStorage('rc-experimental-theme', true);

	useThemeShortcut(
		'ArrowUp ArrowDown ArrowUp ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight T',
		useCallback(() => {
			setValue((value) => !value);
		}, [setValue]),
	);

	return value;
};
