import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

import { selectedMessageStore } from './SelectedMessageStore';

type SelectMessageContextValue = {
	selectedMessageStore: typeof selectedMessageStore;
};

export const SelectedMessageContext = createContext({
	selectedMessageStore,
} as SelectMessageContextValue);

export const useIsSelecting = (): boolean => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on('toggleIsSelecting', callback),
		[selectedMessageStore],
	);

	const getSnapshot = (): boolean => selectedMessageStore.getIsSelecting();

	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useToggleSelectAll = (): (() => void) => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);
	return useCallback(() => {
		selectedMessageStore.toggleAll(Array.from(selectedMessageStore.availableMessages));
	}, [selectedMessageStore]);
};

export const useClearSelection = (): (() => void) => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);
	return useCallback(() => {
		selectedMessageStore.clearStore();
	}, [selectedMessageStore]);
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

export const useAvailableMessagesCount = () => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on('change', callback),
		[selectedMessageStore],
	);

	const getSnapshot = () => selectedMessageStore.availableMessagesCount();

	return useSyncExternalStore(subscribe, getSnapshot);
};
