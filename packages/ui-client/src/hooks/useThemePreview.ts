import type { ThemePreference as ThemeMode } from '@rocket.chat/core-typings';
import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
let preview: ThemeMode | undefined;

export const setThemePreview = (mode: ThemeMode | undefined): void => {
	if (preview === mode) {
		return;
	}
	preview = mode;
	listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getSnapshot = (): ThemeMode | undefined => preview;

export const useThemePreview = (): ThemeMode | undefined => useSyncExternalStore(subscribe, getSnapshot);
