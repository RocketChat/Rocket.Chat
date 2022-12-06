import type { VisitorSearchChatsResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type HistoryListOptions = {
	filter: string;
	roomId: string;
	visitorId: string;
};

export const useHistoryList = (
	options: HistoryListOptions,
): {
	itemsList: RecordList<VisitorSearchChatsResult & { _updatedAt: Date }>;
	initialItemCount: number;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<VisitorSearchChatsResult & { _updatedAt: Date }>());
	const reload = useCallback(() => setItemsList(new RecordList<VisitorSearchChatsResult & { _updatedAt: Date }>()), []);

	const getHistory = useEndpoint('GET', `/v1/livechat/visitors.searchChats/room/${options.roomId}/visitor/${options.visitorId}`);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { history, total } = await getHistory({
				...(options.filter && { searchText: options.filter }),
				closedChatsOnly: 'true',
				servedChatsOnly: 'true',
				offset: start,
				count: end + start,
			});
			return {
				items: history.map((history: any) => ({
					...history,
					ts: new Date(history.ts),
					_updatedAt: new Date(history.ts),
				})),
				itemCount: total,
			};
		},
		[getHistory, options],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
