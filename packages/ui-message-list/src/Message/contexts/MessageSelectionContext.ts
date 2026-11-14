import type { IMessage } from '@rocket.chat/core-typings';
import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

/**
 * The messages picked in selection mode. Each provider owns one, so a thread never registers into the room's selection.
 */
export type MessageSelectionStore = {
	subscribe: (onStoreChange: () => void) => () => void;
	isSelecting: () => boolean;
	isSelected: (messageId: IMessage['_id']) => boolean;
	toggle: (messageId: IMessage['_id']) => void;
};

export const MessageSelectionContext = createContext<MessageSelectionStore | undefined>(undefined);

const notSelecting = () => false;
const noSubscription = () => () => undefined;

export const useIsSelectingMessages = () => {
	const store = useContext(MessageSelectionContext);
	return useSyncExternalStore(store?.subscribe ?? noSubscription, store?.isSelecting ?? notSelecting);
};

export const useIsMessageSelected = (messageId: IMessage['_id']) => {
	const store = useContext(MessageSelectionContext);
	const isSelected = useCallback(() => store?.isSelected(messageId) ?? false, [store, messageId]);
	return useSyncExternalStore(store?.subscribe ?? noSubscription, isSelected);
};

export const useToggleMessageSelection = (messageId: IMessage['_id']) => {
	const store = useContext(MessageSelectionContext);
	return useCallback(() => store?.toggle(messageId), [store, messageId]);
};

/** A store of selected messages, for a provider of {@link MessageSelectionContext}. */
export const createMessageSelectionStore = ({ isSelecting = false } = {}) => {
	const listeners = new Set<() => void>();
	let selecting = isSelecting;
	let selected = new Set<IMessage['_id']>();
	const notify = () => listeners.forEach((listener) => listener());

	return {
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		isSelecting: () => selecting,
		isSelected: (messageId: IMessage['_id']) => selected.has(messageId),
		toggle: (messageId: IMessage['_id']) => {
			selected = new Set(selected);
			if (!selected.delete(messageId)) {
				selected.add(messageId);
			}
			notify();
		},
		setSelecting: (value: boolean) => {
			selecting = value;
			if (!value) {
				selected = new Set();
			}
			notify();
		},
		getSelected: () => [...selected],
	} satisfies MessageSelectionStore & Record<string, unknown>;
};
