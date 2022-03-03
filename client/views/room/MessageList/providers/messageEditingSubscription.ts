import { Subscription, Unsubscribe } from 'use-subscription';

import { IMessage } from '../../../../../definition/IMessage';

type SetEditingFn = (_id: IMessage['_id']) => void;
type ClearEditingFn = (_id: IMessage['_id']) => void;

type MessageEditingSubscription = {
	subscription: Subscription<IMessage['_id'] | undefined>;
	setEditing: SetEditingFn;
	clearEditing: ClearEditingFn;
};

const createMessageEditingSubscription = (): MessageEditingSubscription => {
	let updateCb: Unsubscribe = () => undefined;

	let editingMessageId: IMessage['_id'] | undefined;

	const subscription: Subscription<typeof editingMessageId> = {
		subscribe: (cb) => {
			updateCb = cb;
			return (): void => {
				updateCb = (): void => undefined;
			};
		},

		getCurrentValue: (): typeof editingMessageId => editingMessageId,
	};

	const setEditing = (_id: IMessage['_id']): void => {
		editingMessageId = _id;
		updateCb();
	};

	const clearEditing = (): void => {
		editingMessageId = undefined;
		updateCb();
	};

	return { subscription, setEditing, clearEditing };
};

export const {
	subscription: messageEditingSubscription,
	setEditing: setEditingMessage,
	clearEditing: clearEditingMessage,
} = createMessageEditingSubscription();
