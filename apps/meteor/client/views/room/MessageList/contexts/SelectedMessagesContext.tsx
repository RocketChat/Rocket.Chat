import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

import { selectedMessageStore } from '../../providers/SelectedMessagesProvider';

type SelectMessageContextValue = {
	selectedMessageStore: typeof selectedMessageStore;
};

export const SelectedMessageContext = createContext({
	selectedMessageStore,
} as SelectMessageContextValue);

export const useIsSelectedMessage = (mid: string, omit?: boolean): boolean => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on(mid, callback),
		[selectedMessageStore, mid],
	);

	const getSnapshot = (): boolean => selectedMessageStore.isSelected(mid);

	const isSelected = useSyncExternalStore(subscribe, getSnapshot);

	useEffect(() => {
		if (isSelected || omit) {
			return;
		}

		selectedMessageStore.addAvailableMessage(mid);

		return () => selectedMessageStore.removeAvailableMessage(mid);
	}, [mid, selectedMessageStore, isSelected, omit]);

	return isSelected;
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
