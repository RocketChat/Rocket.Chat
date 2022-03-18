import { OffCallbackHandler } from '@rocket.chat/emitter';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
	const [isSelecting, setIsSelecting] = useState<boolean>(selectedMessageStore.getIsSelecting());
	useEffect(() => selectedMessageStore.on('toggleSelect', setIsSelecting), [selectedMessageStore]);

	return isSelecting;
};

export const useToggleSelect = (mid: string): (() => void) => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);
	return useCallback(() => {
		selectedMessageStore.toggle(mid);
	}, [mid, selectedMessageStore]);
};

export const useCountSelected = (): number => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);
	const [counter, setCounter] = useState(selectedMessageStore.count());
	selectedMessageStore.on('change', () => setCounter(selectedMessageStore.count()));
	return counter;
};

export const useClearStore = (): void => {
	const { selectedMessageStore } = useContext(SelectedMessageContext);
	return selectedMessageStore.clear();
};
