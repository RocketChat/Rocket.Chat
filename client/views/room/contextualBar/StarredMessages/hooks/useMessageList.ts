import { useCallback, useReducer } from 'react';

import { IMessage } from '../../../../../../definition/IMessage';

type MessageList = {
	messages: IMessage[];
	upsertMessage: (message: IMessage) => void;
	bulkUpsertMessages: (messages: IMessage[]) => void;
	deleteMessage: (mid: IMessage['_id']) => void;
};

type UpsertAction = {
	type: 'upsert';
	payload: IMessage;
};

type BulkUpsertAction = {
	type: 'bulkUpsert';
	payload: IMessage[];
};

type DeleteAction = {
	type: 'delete';
	payload: IMessage['_id'];
};

type Action = UpsertAction | BulkUpsertAction | DeleteAction;

const findUpsertIndex = (
	sortedMessages: IMessage[],
	message: IMessage,
	start = 0,
): ['insert', number] | ['update', number] => {
	const { _id } = message;
	const ts = message.ts.getTime();

	for (let i = start; i < sortedMessages.length; ++i) {
		const message = sortedMessages[i];

		if (message._id === _id) {
			return ['update', i];
		}

		if (ts < message.ts.getTime()) {
			return ['insert', i];
		}
	}

	if (start > 0) {
		for (let i = 0; i < start; ++i) {
			const message = sortedMessages[i];

			if (message._id === _id) {
				return ['update', i];
			}
		}
	}

	return ['insert', sortedMessages.length];
};

const compareMessages = (a: IMessage, b: IMessage): number => {
	if (a._id === b._id) {
		return 0;
	}

	return a.ts.getTime() - b.ts.getTime();
};

export const messageReducer = (state: IMessage[], action: Action): IMessage[] => {
	switch (action.type) {
		case 'upsert': {
			const newState = [...state];
			const [type, index] = findUpsertIndex(newState, action.payload);

			if (type === 'insert') {
				newState.splice(index, 0, action.payload);
				return newState;
			}

			newState[index] = action.payload;
			return newState;
		}

		case 'bulkUpsert': {
			if (action.payload.length === 0) {
				return state;
			}

			const newState = [...state];
			const newMessages = [...action.payload].sort(compareMessages);

			let lastIndex = 0;
			for (const newMessage of newMessages) {
				const [type, index] = findUpsertIndex(newState, newMessage, lastIndex);
				lastIndex = index;

				if (type === 'insert') {
					newState.splice(index, 0, newMessage);
					continue;
				}

				newState[index] = newMessage;
			}

			return newState;
		}

		case 'delete':
			return state.filter((message) => message._id !== action.payload);

		default:
			return state;
	}
};

export const useMessageList = (): MessageList => {
	const [messages, changeMessageList] = useReducer(messageReducer, []);

	const upsertMessage = useCallback<MessageList['upsertMessage']>((message) => changeMessageList({
		type: 'upsert',
		payload: message,
	}), []);

	const bulkUpsertMessages = useCallback<MessageList['bulkUpsertMessages']>((messages) => changeMessageList({
		type: 'bulkUpsert',
		payload: messages,
	}), []);

	const deleteMessage = useCallback<MessageList['deleteMessage']>((mid) => changeMessageList({
		type: 'delete',
		payload: mid,
	}), []);

	return {
		messages,
		upsertMessage,
		bulkUpsertMessages,
		deleteMessage,
	};
};
