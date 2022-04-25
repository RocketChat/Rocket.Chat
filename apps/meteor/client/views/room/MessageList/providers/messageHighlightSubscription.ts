import { IMessage } from '@rocket.chat/core-typings';
import { Subscription, Unsubscribe } from 'use-subscription';

type SetHighlightFn = (_id: IMessage['_id']) => void;
type ClearHighlightFn = (_id: IMessage['_id']) => void;

type MessageHighlightSubscription = {
	subscription: Subscription<IMessage['_id'] | undefined>;
	setHighlight: SetHighlightFn;
	clearHighlight: ClearHighlightFn;
};

const createMessageHighlightSubscription = (): MessageHighlightSubscription => {
	let updateCb: Unsubscribe = () => undefined;

	let highlightMessageId: IMessage['_id'] | undefined;

	const subscription: Subscription<typeof highlightMessageId> = {
		subscribe: (cb) => {
			updateCb = cb;
			return (): void => {
				updateCb = (): void => undefined;
			};
		},

		getCurrentValue: (): typeof highlightMessageId => highlightMessageId,
	};

	const setHighlight = (_id: IMessage['_id']): void => {
		highlightMessageId = _id;
		updateCb();
	};

	const clearHighlight = (): void => {
		highlightMessageId = undefined;
		updateCb();
	};

	return { subscription, setHighlight, clearHighlight };
};

export const {
	subscription: messageHighlightSubscription,
	setHighlight: setHighlightMessage,
	clearHighlight: clearHighlightMessage,
} = createMessageHighlightSubscription();
