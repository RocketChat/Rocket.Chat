import { useCallback, useEffect } from 'react';

import { RecordList } from '../../lib/lists/RecordList';
import { IRocketChatRecord } from '../../../definition/IRocketChatRecord';

const INITIAL_ITEM_COUNT = 25;

export const useScrollableRecordList = <T extends IRocketChatRecord>(
	recordList: RecordList<T>,
	fetchItems: (start: number, end: number) => Promise<T[]>,
	initialItemCount: number = INITIAL_ITEM_COUNT,
): {
	loadMoreItems: (start: number, end: number) => void;
	initialItemCount: number;
} => {
	const loadMoreItems = useCallback(
		(start: number, end: number) => {
			recordList.pushMany(() => fetchItems(start, end));
		},
		[recordList, fetchItems],
	);

	useEffect(() => {
		loadMoreItems(0, initialItemCount ?? INITIAL_ITEM_COUNT);
	}, [loadMoreItems, initialItemCount]);

	return { loadMoreItems, initialItemCount };
};
