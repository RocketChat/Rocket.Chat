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
	let updateCb: () => void = () => undefined;

	let highlightMessageId: IMessage['_id'] | undefined;

	const subscribe = (cb: () => void): (() => void) => {
		updateCb = cb;
		return (): void => {
			updateCb = (): void => undefined;
		};
	};

	const getSnapshot = (): typeof highlightMessageId => highlightMessageId;

	const setHighlight = (_id: IMessage['_id']): void => {
		highlightMessageId = _id;
		updateCb();
	};

	const clearHighlight = (): void => {
		highlightMessageId = undefined;
		updateCb();
	};

	return { subscribe, getSnapshot, setHighlight, clearHighlight };
};

export const {
	getSnapshot,
	subscribe,
	setHighlight: setHighlightMessage,
	clearHighlight: clearHighlightMessage,
} = createMessageHighlightSubscription();
