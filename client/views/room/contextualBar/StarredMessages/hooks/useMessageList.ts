import { useCallback, useReducer } from 'react';

import { IMessage } from '../../../../../../definition/IMessage';

type MessageList = {
	messages: IMessage[];
	upsertMessage: (payload: IMessage) => void;
	deleteMessage: (payload: { _id: string }) => void;
};

type UpsertAction = {
	type: 'upsert';
	payload: IMessage;
};

type DeleteAction = {
	type: 'delete';
	payload: { _id: string };
};

  type Action = UpsertAction | DeleteAction;

const messageReducer = (state: IMessage[], action: Action): IMessage[] => {
	const index = state.findIndex((value) => value._id === action.payload?._id);

	switch (action.type) {
		case 'upsert':
			if (index > -1) {
				state[index] = action.payload;

				return [...state];
			}

			return [...state, action.payload];
		case 'delete':
			if (index > -1) {
				state.slice(0, index).concat(state.slice(index + 1));
			}

			return [...state];
		default:
			return state;
	}
};

export const useMessageList = (): MessageList => {
	const [messages, changeMessageList] = useReducer(messageReducer, []);

	const upsertMessage = useCallback((payload: IMessage) => changeMessageList({ type: 'upsert', payload }), []);
	const deleteMessage = useCallback((payload: { _id: string }) => changeMessageList({ type: 'delete', payload }), []);

	return {
		messages,
		upsertMessage,
		deleteMessage,
	};
};
