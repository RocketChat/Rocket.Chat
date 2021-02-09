import { useCallback, useEffect } from 'react';

import { RecordList, RecordListBatchChanges } from '../../lib/lists/RecordList';
import { IRocketChatRecord } from '../../../definition/IRocketChatRecord';

const INITIAL_ITEM_COUNT = 25;

export const useScrollableRecordList = <T extends IRocketChatRecord>(
	recordList: RecordList<T>,
	fetchBatchChanges: (start: number, end: number) => Promise<RecordListBatchChanges<T>>,
	initialItemCount: number = INITIAL_ITEM_COUNT,
): {
	loadMoreItems: (start: number, end: number) => void;
	initialItemCount: number;
} => {
	const loadMoreItems = useCallback(
		(start: number, end: number) => {
			recordList.batchHandle(() => fetchBatchChanges(start, end));
		},
		[recordList, fetchBatchChanges],
	);

	useEffect(() => {
		loadMoreItems(0, initialItemCount ?? INITIAL_ITEM_COUNT);
	}, [loadMoreItems, initialItemCount]);

	return { loadMoreItems, initialItemCount };
};
