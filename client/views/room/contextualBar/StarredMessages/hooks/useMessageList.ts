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

const compareMessages = (a: IMessage, b: IMessage): number =>
	b.ts.getTime() - a.ts.getTime();

export const messageReducer = (state: IMessage[], action: Action): IMessage[] => {
	switch (action.type) {
		case 'upsert': {
			return [
				action.payload,
				...state.filter((message) => message._id !== action.payload._id),
			].sort(compareMessages);
		}

		case 'bulkUpsert': {
			if (action.payload.length === 0) {
				return state;
			}

			const newIds = action.payload.map((message) => message._id);

			return [
				...action.payload,
				...state.filter((message) => !newIds.includes(message._id)),
			].sort(compareMessages);
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
