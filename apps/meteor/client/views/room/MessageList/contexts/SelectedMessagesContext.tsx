import { OffCallbackHandler } from '@rocket.chat/emitter';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { selectedMessageStore } from '../../providers/SelectedMessagesProvider';

type SelectMessageContextValue = {
	selectedMessageStore: typeof selectedMessageStore;
};

export const SelectedMessageContext = createContext({
	selectedMessageStore,
} as SelectMessageContextValue);

export const useIsSelectedMessage = (mid: string): boolean => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);
	const subscription = useMemo(
		() => ({
			getCurrentValue: (): boolean => selectedMessageStore.isSelected(mid),
			subscribe: (callback: () => void): OffCallbackHandler => selectedMessageStore.on(mid, callback),
		}),
		[mid, selectedMessageStore],
	);
	return useSubscription(subscription);
};

export const useIsSelecting = (): boolean => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	return useSubscription(
		useMemo(
			() => ({
				getCurrentValue: (): boolean => selectedMessageStore.getIsSelecting(),
				subscribe: (callback: () => void): OffCallbackHandler => selectedMessageStore.on('toggleIsSelecting', callback),
			}),
			[selectedMessageStore],
		),
	);
};

export const useToggleSelect = (mid: string): (() => void) => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);
	return useCallback(() => {
		selectedMessageStore.toggle(mid);
	}, [mid, selectedMessageStore]);
};

export const useCountSelected = (): number => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	return useSubscription(
		useMemo(
			() => ({
				getCurrentValue: (): number => selectedMessageStore.count(),
				subscribe: (callback: () => void): OffCallbackHandler => selectedMessageStore.on('change', callback),
			}),
			[selectedMessageStore],
		),
	);
};
