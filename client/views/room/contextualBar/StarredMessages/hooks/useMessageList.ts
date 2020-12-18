import { useCallback } from 'react';

import { IMessage } from '../../../../../../definition/IMessage';
import { useAsyncState } from '../../../../../hooks/useAsyncState';

type MessageList = {
	messages: IMessage[] | undefined;
	upsertMessage: (message: IMessage) => void;
	bulkUpsertMessages: (messages: IMessage[]) => void;
	deleteMessage: (mid: IMessage['_id']) => void;
	reject: (error: Error) => void;
	reset: () => void;
	update: () => void;
};

const compareMessages = (a: IMessage, b: IMessage): number =>
	b.ts.getTime() - a.ts.getTime();

export const useMessageList = (): MessageList => {
	const { resolve, reject, reset, update, ...state } = useAsyncState<IMessage[]>();

	const upsertMessage = useCallback<MessageList['upsertMessage']>((upsertedMessage) => {
		resolve((state = []) => [
			upsertedMessage,
			...state.filter((message) => message._id !== upsertedMessage._id),
		].sort(compareMessages));
	}, [resolve]);

	const bulkUpsertMessages = useCallback<MessageList['bulkUpsertMessages']>((upsertedMessages) => {
		resolve((state = []) => {
			if (upsertedMessages.length === 0) {
				return state;
			}

			const newIds = upsertedMessages.map((message) => message._id);

			return [
				...upsertedMessages,
				...state.filter((message) => !newIds.includes(message._id)),
			].sort(compareMessages);
		});
	}, [resolve]);

	const deleteMessage = useCallback<MessageList['deleteMessage']>((mid) => {
		resolve((state = []) => state.filter((message) => message._id !== mid));
	}, [resolve]);

	return {
		messages: state.value,
		upsertMessage,
		bulkUpsertMessages,
		deleteMessage,
		reject,
		reset,
		update,
	};
};
