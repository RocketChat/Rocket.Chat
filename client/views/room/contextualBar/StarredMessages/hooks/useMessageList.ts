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

const messageReducer = (state: IMessage[], action: Action): IMessage[] => {
	switch (action.type) {
		case 'upsert': {
			const index = state.findIndex((value) => value._id === action.payload?._id);
			if (index > -1) {
				state[index] = action.payload;

				return [...state];
			}

			return [...state, action.payload];
		}

		case 'bulkUpsert': {
			if (action.payload.length === 0) {
				return state;
			}

			const map = new Map<IMessage['_id'], IMessage>([
				...state.map<[IMessage['_id'], IMessage]>((message) => [message._id, message]),
				...action.payload.map<[IMessage['_id'], IMessage]>((message) => [message._id, message]),
			]);

			return Array.from(map.values());
		}

		case 'delete': {
			const index = state.findIndex((value) => value._id === action.payload);
			if (index > -1) {
				state.slice(0, index).concat(state.slice(index + 1));
			}

			return [...state];
		}

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
