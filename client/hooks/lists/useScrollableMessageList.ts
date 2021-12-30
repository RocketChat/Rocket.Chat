import { useCallback } from 'react';

import { IMessage } from '../../../definition/IMessage';
import { Serialized } from '../../../definition/Serialized';
import { MessageList } from '../../lib/lists/MessageList';
import { RecordListBatchChanges } from '../../lib/lists/RecordList';
import { mapMessageFromApi } from '../../lib/utils/mapMessageFromApi';
import { useScrollableRecordList } from './useScrollableRecordList';

export const useScrollableMessageList = (
	messageList: MessageList,
	fetchMessages: (start: number, end: number) => Promise<RecordListBatchChanges<Serialized<IMessage>>>,
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
