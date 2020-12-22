import { useCallback, useEffect, useRef } from 'react';

import { MessageMap } from './useMessageList';
import { IMessage } from '../../../../../../definition/IMessage';
import { useGetStarredMessages } from './useGetStarredMessages';

const LIMIT_DEFAULT = 10;

export const useStarredMessagesFromEndpoint = (
	rid: IMessage['rid'],
	update: (mutation: (prev: MessageMap) => Promise<void>) => void,
): (() => void) => {
	const getStarredMessages = useGetStarredMessages();

	const fetchData = useCallback((rid, offset) => update(async (map) => {
		if (offset === 0) {
			map.clear();
		}

		const messages = await getStarredMessages({
			roomId: rid,
			offset,
			count: LIMIT_DEFAULT,
		});

		for (const message of messages) {
			map.set(message._id, message);
		}
	}), [getStarredMessages, update]);

	const offsetRef = useRef(0);

	useEffect(() => {
		offsetRef.current = 0;
		fetchData(rid, offsetRef.current);
	}, [fetchData, rid]);

	const loadMore = useCallback(() => {
		offsetRef.current += LIMIT_DEFAULT;
		fetchData(rid, offsetRef.current);
	}, [fetchData, rid]);

	return loadMore;
};
