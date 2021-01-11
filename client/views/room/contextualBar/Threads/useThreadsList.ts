import { useCallback, useEffect, useState } from 'react';
import { useSafely } from '@rocket.chat/fuselage-hooks';

import { ThreadsList, ThreadsListOptions } from '../../../../lib/lists/ThreadsList';
import { useEndpoint } from '../../../../contexts/ServerContext';
import { useMessageListInRoom } from '../hooks/useMessageListInRoom';

export const useThreadsList = (options: ThreadsListOptions): [ThreadsList, number, (start: number, end: number) => void] => {
	const [threadsList] = useState(() => new ThreadsList(options));
	const [total, setTotal] = useSafely(useState(0));

	useEffect(() => {
		if (threadsList.options !== options) {
			threadsList.updateFilters(options);
		}
	}, [threadsList, options]);

	const getThreadsList = useEndpoint('GET', 'chat.getThreadsList');

	const fetch = useCallback(async (start, end) => {
		const { threads, total } = await getThreadsList({
			rid: options.rid,
			type: options.type,
			text: options.text,
			offset: start,
			count: end - start,
		});

		setTotal(total);

		return threads;
	}, [getThreadsList, options.rid, options.text, options.type, setTotal]);

	const loadMessages = useMessageListInRoom(threadsList, options.rid, fetch);

	return [threadsList, total, loadMessages];
};
