import type { SyntheticEvent } from 'react';
import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

import { selectedMessageStore as defaultSelectedMessageStore } from '../../providers/SelectedMessagesProvider';

export type SelectMessageContextValue = {
	selectedMessageStore: typeof defaultSelectedMessageStore;
};

export const SelectedMessageContext = createContext<SelectMessageContextValue | undefined>(undefined);

export const useSelectedMessageStore = () => {
	const context = useContext(SelectedMessageContext);
	return context?.selectedMessageStore ?? defaultSelectedMessageStore;
};

export const useIsSelectedMessage = (mid: string, omit?: boolean): boolean => {
	const selectedMessageStore = useSelectedMessageStore();

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
	}, [mid, selectedMessageStore, isSelected, omit]);

	return isSelected;
};

export const useIsSelecting = (): boolean => {
	const selectedMessageStore = useSelectedMessageStore();

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on('toggleIsSelecting', callback),
		[selectedMessageStore],
	);

	const getSnapshot = (): boolean => selectedMessageStore.getIsSelecting();

	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useToggleSelect = (mid: string): ((event?: SyntheticEvent<HTMLElement>) => void) => {
	const selectedMessageStore = useSelectedMessageStore();

	return useCallback(
		(event) => {
			event?.stopPropagation();
			selectedMessageStore.toggle(mid);
		},
		[mid, selectedMessageStore],
	);
};

export const useToggleSelectAll = (): (() => void) => {
	const selectedMessageStore = useSelectedMessageStore();
	return useCallback(() => {
		selectedMessageStore.toggleAll(Array.from(selectedMessageStore.availableMessages));
	}, [selectedMessageStore]);
};

export const useClearSelection = (): (() => void) => {
	const selectedMessageStore = useSelectedMessageStore();
	return useCallback(() => {
		selectedMessageStore.clearStore();
	}, [selectedMessageStore]);
};

export const useCountSelected = (): number => {
	const selectedMessageStore = useSelectedMessageStore();

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on('change', callback),
		[selectedMessageStore],
	);

	const getSnapshot = (): number => selectedMessageStore.count();

	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useAvailableMessagesCount = () => {
	const selectedMessageStore = useSelectedMessageStore();

	const subscribe = useCallback(
		(callback: () => void): (() => void) => selectedMessageStore.on('change', callback),
		[selectedMessageStore],
	);

	const getSnapshot = () => selectedMessageStore.availableMessagesCount();

	return useSyncExternalStore(subscribe, getSnapshot);
};
