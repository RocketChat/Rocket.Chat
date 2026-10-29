import type { IMessage } from '@rocket.chat/core-typings';

/** The message the composer is editing, which every list shows with the editing look. */
const createEditingMessageSubscription = () => {
	const listeners = new Set<() => void>();
	let editingMessageId: IMessage['_id'] | undefined;

	const notify = () => listeners.forEach((listener) => listener());

	return {
		subscribe: (callback: () => void): (() => void) => {
			listeners.add(callback);
			return () => {
				listeners.delete(callback);
			};
		},
		getSnapshot: (): IMessage['_id'] | undefined => editingMessageId,
		setEditingMessage: (messageId: IMessage['_id']): void => {
			editingMessageId = messageId;
			notify();
		},
		clearEditingMessage: (): void => {
			editingMessageId = undefined;
			notify();
		},
	};
};

export const { subscribe, getSnapshot, setEditingMessage, clearEditingMessage } = createEditingMessageSubscription();
