import type { IMessage } from '@rocket.chat/core-typings';

type SetHighlightFn = (_id: IMessage['_id']) => void;
type ClearHighlightFn = () => void;

type MessageHighlightSubscription = {
	subscribe: (callback: () => void) => () => void;
	getSnapshot: () => IMessage['_id'] | undefined;
	setHighlight: SetHighlightFn;
	clearHighlight: ClearHighlightFn;
};

const createMessageHighlightSubscription = (): MessageHighlightSubscription => {
	const listeners = new Set<() => void>();
	const notify = () => listeners.forEach((listener) => listener());

	let highlightMessageId: IMessage['_id'] | undefined;

	const subscribe = (cb: () => void): (() => void) => {
		listeners.add(cb);
		return (): void => {
			listeners.delete(cb);
		};
	};

	const getSnapshot = (): typeof highlightMessageId => highlightMessageId;

	const setHighlight = (_id: IMessage['_id']): void => {
		highlightMessageId = _id;
		notify();
	};

	const clearHighlight = (): void => {
		highlightMessageId = undefined;
		notify();
	};

	return { subscribe, getSnapshot, setHighlight, clearHighlight };
};

export const {
	getSnapshot,
	subscribe,
	setHighlight: setHighlightMessage,
	clearHighlight: clearHighlightMessage,
} = createMessageHighlightSubscription();
