import type { IUser } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { useScrollableMessageList } from '../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../hooks/lists/useStreamUpdatesForMessageList';
import { ThreadsList, ThreadsListOptions } from '../../../../lib/lists/ThreadsList';
import { getConfig } from '../../../../lib/utils/getConfig';

export const useThreadsList = (
	options: ThreadsListOptions,
	uid: IUser['_id'],
): {
	threadsList: ThreadsList;
	initialItemCount: number;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const threadsList = useMemo(() => new ThreadsList(options), [options]);

	const getThreadsList = useEndpoint('GET', 'chat.getThreadsList');

	const fetchMessages = useCallback(
		async (start, end) => {
			const { threads, total } = await getThreadsList({
				rid: options.rid,
				type: options.type,
				text: options.text,
				offset: start,
				count: end,
			});

			return {
				items: threads,
				itemCount: total,
			};
		},
		[getThreadsList, options.rid, options.text, options.type],
	);

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(
		threadsList,
		fetchMessages,
		useMemo(() => {
			const threadsListSize = getConfig('threadsListSize');
			return threadsListSize ? parseInt(threadsListSize, 10) : undefined;
		}, []),
	);
	useStreamUpdatesForMessageList(threadsList, uid, options.rid);

	return {
		threadsList,
		loadMoreItems,
		initialItemCount,
	};
};
