import { createContext, useCallback, useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { selectedMessageStore } from '../../providers/SelectedMessagesProvider';

type SelectMessageContextValue = {
	selectedMessageStore: typeof selectedMessageStore;
};

export const SelectedMessageContext = createContext({
	selectedMessageStore,
} as SelectMessageContextValue);

export const useIsSelectedMessage = (mid: string): boolean => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on(mid, callback),
		[selectedMessageStore, mid],
	);

	const getSnapshot = (): boolean => selectedMessageStore.isSelected(mid);

	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useIsSelecting = (): boolean => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on('toggleIsSelecting', callback),
		[selectedMessageStore],
	);

	const getSnapshot = (): boolean => selectedMessageStore.getIsSelecting();

	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useToggleSelect = (mid: string): (() => void) => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);
	return useCallback(() => {
		selectedMessageStore.toggle(mid);
	}, [mid, selectedMessageStore]);
};

export const useCountSelected = (): number => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on('change', callback),
		[selectedMessageStore],
	);

	const getSnapshot = (): number => selectedMessageStore.count();

	return useSyncExternalStore(subscribe, getSnapshot);
};
