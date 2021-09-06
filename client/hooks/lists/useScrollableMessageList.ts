import { useCallback } from 'react';

import { FromApi } from '../../../definition/FromApi';
import { IMessage } from '../../../definition/IMessage';
import { mapMessageFromApi } from '../../lib/fromApi';
import { MessageList } from '../../lib/lists/MessageList';
import { RecordListBatchChanges } from '../../lib/lists/RecordList';
import { useScrollableRecordList } from './useScrollableRecordList';

export const useScrollableMessageList = (
	messageList: MessageList,
	fetchMessages: (start: number, end: number) => Promise<RecordListBatchChanges<FromApi<IMessage>>>,
	initialItemCount?: number,
): ReturnType<typeof useScrollableRecordList> => {
	const fetchItems = useCallback(
		async (start: number, end: number): Promise<RecordListBatchChanges<IMessage>> => {
			const batchChanges = await fetchMessages(start, end);
			return {
				...(batchChanges.items && { items: batchChanges.items.map(mapMessageFromApi) }),
				...(batchChanges.itemCount && { itemCount: batchChanges.itemCount }),
			};
		},
		[fetchMessages],
	);

	return useScrollableRecordList(messageList, fetchItems, initialItemCount);
};
