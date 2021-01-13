import { useCallback } from 'react';

import { IMessage } from '../../../definition/IMessage';
import { MessageList } from '../../lib/lists/MessageList';
import { ObjectFromApi } from '../../../definition/ObjectFromApi';
import { useScrollableRecordList } from './useScrollableRecordList';
import { RecordListBatchChanges } from '../../lib/lists/RecordList';

const convertMessageFromApi = (apiMessage: ObjectFromApi<IMessage>): IMessage => ({
	...apiMessage,
	_updatedAt: new Date(apiMessage._updatedAt),
	ts: new Date(apiMessage.ts),
	...apiMessage.tlm && { tlm: new Date(apiMessage.tlm) },
});

export const useScrollableMessageList = (
	messageList: MessageList,
	fetchMessages: (start: number, end: number) => Promise<RecordListBatchChanges<ObjectFromApi<IMessage>>>,
	initialItemCount?: number,
): ReturnType<typeof useScrollableRecordList> => {
	const fetchItems = useCallback(async (start: number, end: number): Promise<RecordListBatchChanges<IMessage>> => {
		const batchChanges = await fetchMessages(start, end);
		return {
			...batchChanges.items && { items: batchChanges.items.map(convertMessageFromApi) },
			...batchChanges.itemCount && { itemCount: batchChanges.itemCount },
		};
	}, [fetchMessages]);

	return useScrollableRecordList(messageList, fetchItems, initialItemCount);
};
