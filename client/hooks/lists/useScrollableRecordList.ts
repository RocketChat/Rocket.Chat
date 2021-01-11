import { useCallback, useEffect } from 'react';

import { RecordList } from '../../lib/lists/RecordList';
import { IRocketChatRecord } from '../../../definition/IRocketChatRecord';

const INITIAL_ITEM_COUNT = 50;

export const useScrollableRecordList = <T extends IRocketChatRecord>(
	recordList: RecordList<T>,
	fetchItems: (start: number, end: number) => Promise<T[]>,
): {
	loadMoreItems: (start: number, end: number) => void;
} => {
	const loadMoreItems = useCallback((start: number, end: number) => {
		recordList.pushMany(() => fetchItems(start, end));
	}, [recordList, fetchItems]);

	useEffect(() => {
		loadMoreItems(0, INITIAL_ITEM_COUNT);
	}, [loadMoreItems]);

	return { loadMoreItems };
};
