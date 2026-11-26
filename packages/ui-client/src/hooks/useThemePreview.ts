import type { ThemePreference } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

const ee = new Emitter<{ change: void }>();

let current: { preference: ThemePreference } | undefined;

/**
 * Returns the theme preference being previewed, if any, so the app can show it before it is saved.
 */
export const usePreviewedThemePreference = (): ThemePreference | undefined =>
	useSyncExternalStore(
		useCallback((callback: () => void) => ee.on('change', callback), []),
		() => current?.preference,
	);

/**
 * Previews a theme preference across the whole app while the calling component is mounted.
 */
export const useThemePreview = (preference: ThemePreference | undefined) => {
	useEffect(() => {
		if (!preference) {
			return;
		}

		const entry = { preference };
		current = entry;
		ee.emit('change');

		return () => {
			if (current === entry) {
				current = undefined;
				ee.emit('change');
			}
		};
	}, [preference]);
};
