import { useCallback, useEffect, useMemo } from 'react';

import { RecordList } from '../../lib/lists/RecordList';
import { IRocketChatRecord } from '../../../definition/IRocketChatRecord';
import { getConfig } from '../../../app/ui-utils/client/config';

const INITIAL_ITEM_COUNT = 50;

export const useScrollableRecordList = <T extends IRocketChatRecord>(
	recordList: RecordList<T>,
	fetchItems: (start: number, end: number) => Promise<T[]>,
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

	const initialItemCount = useMemo(
		() => parseInt(getConfig('threadsListSize'), 10) || parseInt(getConfig('discussionListSize'), 10) || INITIAL_ITEM_COUNT,
		[],
	);

	useEffect(() => {
		loadMoreItems(0, initialItemCount);
	}, [loadMoreItems, initialItemCount]);

	return { loadMoreItems, initialItemCount };
};
