import { useCallback, useEffect } from 'react';

import { RecordList, RecordListBatchChanges } from '../../lib/lists/RecordList';
import { IRocketChatRecord } from '../../../definition/IRocketChatRecord';
import { AsyncStatePhase } from '../../lib/asyncState';

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
	}, [recordList, loadMoreItems, initialItemCount]);

	return { loadMoreItems, initialItemCount };
};
