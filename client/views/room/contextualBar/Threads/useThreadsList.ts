import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useState } from 'react';

import {
	ThreadsList,
	ThreadsListOptions,
} from '../../../../lib/lists/ThreadsList';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useScrollableMessageList } from '../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../hooks/lists/useStreamUpdatesForMessageList';
import { IUser } from '../../../../../definition/IUser';

export const useThreadsList = (
	options: ThreadsListOptions,
	uid: IUser['_id'],
): [ThreadsList, number, (start: number, end: number) => void] => {
	const [threadsList] = useState(() => new ThreadsList(options));
	const [total, setTotal] = useSafely(useState(0));

	useEffect(() => {
		if (threadsList.options !== options) {
			threadsList.updateFilters(options);
		}
	}, [threadsList, options]);

	const getThreadsList = useEndpoint('GET', 'chat.getThreadsList');

	const fetchMessages = useCallback(
		async (start, end) => {
			const { threads, total } = await getThreadsList({
				rid: options.rid,
				type: options.type,
				text: options.text,
				offset: start,
				count: end - start,
			});

			setTotal(total);

			return threads;
		},
		[getThreadsList, options.rid, options.text, options.type, setTotal],
	);

	const { loadMoreItems } = useScrollableMessageList(
		threadsList,
		fetchMessages,
	);
	useStreamUpdatesForMessageList(threadsList, uid, options.rid);

	return [threadsList, total, loadMoreItems];
};
