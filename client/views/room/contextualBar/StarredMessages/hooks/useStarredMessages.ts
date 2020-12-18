import { useCallback, useEffect, useState } from 'react';

import { useMessageList } from './useMessageList';
import { useEndpoint, useStream } from '../../../../../contexts/ServerContext';
// import { createFilterFromQuery } from '../../../../../lib/minimongo';

const LIMIT_DEFAULT = 50;

export const useStarredMessages = (rid: string): any => {
	const [offset, setOffset] = useState(0);
	const { messages, upsertMessage/* , deleteMessage*/ } = useMessageList();
	const getStarredMessages = useEndpoint('GET', 'chat.getStarredMessages');
	const messagesStream = useStream('room-messages');
	// const filter = createFilterFromQuery({ starred: { $exists: true } });

	useEffect(() =>	messagesStream(rid, (message) => {
		console.log(message);
	}), [messagesStream, rid]);

	const fetchData = useCallback(async () => {
		const starredMessages = await getStarredMessages({
			roomId: rid,
			count: LIMIT_DEFAULT,
			offset,
		});

		starredMessages.messages.forEach((starredMessage: any) => {
			upsertMessage(starredMessage);
		});
	}, [rid, offset, upsertMessage, getStarredMessages]);

	const loadData = useCallback(() => {
		fetchData();
	}, [fetchData]);

	const loadMore = useCallback(() => {
		setOffset((offset) => offset + LIMIT_DEFAULT);
		loadData();
	}, [setOffset, loadData]);

	return { messages, loadData, loadMore };
};
