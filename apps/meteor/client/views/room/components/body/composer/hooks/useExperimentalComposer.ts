import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

import { useKeyboardShortcuts } from './useRoomComposerShortcut';

export const useExperimentalComposer = (): boolean => {
	const [value, setValue] = useSessionStorage('rc-experimental-composer', false);

	useKeyboardShortcuts(
		'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight B A',
		useCallback(() => {
			setValue((value) => !value);
		}, [setValue]),
	);

	return value;
};
