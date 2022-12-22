import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import { useCallback, useEffect } from 'react';

import { AsyncStatePhase } from '../../lib/asyncState';
import type { RecordList, RecordListBatchChanges } from '../../lib/lists/RecordList';

const INITIAL_ITEM_COUNT = 25;

export const useScrollableRecordList = <T extends IRocketChatRecord>(
	recordList: RecordList<T>,
	fetchBatchChanges: (start: number, end: number) => Promise<RecordListBatchChanges<T>>,
	initialItemCount: number = INITIAL_ITEM_COUNT,
): {
	loadMoreItems: (start: number) => void;
	initialItemCount: number;
} => {
	const loadMoreItems = useCallback(
		(start: number) => {
			if (recordList.phase === AsyncStatePhase.LOADING || start + 1 < recordList.itemCount) {
				recordList.batchHandle(() => fetchBatchChanges(start, initialItemCount));
			}
		},
		[recordList, fetchBatchChanges, initialItemCount],
	);

	useEffect(() => {
		loadMoreItems(0);
	}, [loadMoreItems]);

	return { loadMoreItems, initialItemCount };
};
