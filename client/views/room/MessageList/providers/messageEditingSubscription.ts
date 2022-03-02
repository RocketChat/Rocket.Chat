import { IMessage } from '../../../../../definition/IMessage';
// import { IRoom } from '../../../../../definition/IRoom';

const createMessageEditingSubscription = () => {
	let updateCb = () => {};

	let editingMessageId: IMessage['_id'] | undefined;

	const subscription = {
		subscribe: (cb: () => void): (() => void) => {
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

// const createMessageEditingSubscriptionFactory = () => {
// 	const subscriptions = new Map<IRoom['_id'], MessageEditingSubscriptionType>();

// 	const createMessageEditingSubscription = (rid: IRoom['_id']) => {
// 		let updateCb = () => {};

// 		let editingMessageId: IMessage['_id'] | undefined;

// 		const subscribe = (cb: () => void): (() => void) => {
// 			updateCb = cb;
// 			return (): void => {
// 				updateCb = (): void => undefined;
// 			};
// 		};

// 		const getCurrentValue = (): typeof editingMessageId => editingMessageId;

// 		const setEditing = (_id: IMessage['_id']): void => {
// 			editingMessageId = _id;
// 			updateCb();
// 		};

// 		const clearEditing = (): void => {
// 			editingMessageId = undefined;
// 			updateCb();
// 		};

// 		return { subscribe, getCurrentValue, setEditing, clearEditing };
// 	};

// 	return [subscriptions, createMessageEditingSubscription];
// };

export const {
	subscription: messageEditingSubscription,
	setEditing: setEditingMessage,
	clearEditing: clearEditingMessage,
} = createMessageEditingSubscription();
