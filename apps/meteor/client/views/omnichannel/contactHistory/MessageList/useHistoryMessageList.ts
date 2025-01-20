import type { IUser } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useState } from 'react';

import { useScrollableMessageList } from '../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../hooks/lists/useStreamUpdatesForMessageList';
import { useComponentDidUpdate } from '../../../../hooks/useComponentDidUpdate';
import { MessageList } from '../../../../lib/lists/MessageList';
import { getConfig } from '../../../../lib/utils/getConfig';

type HistoryMessageListOptions = {
	filter: string;
	roomId: string;
};

export const useHistoryMessageList = (
	options: HistoryMessageListOptions,
	uid: IUser['_id'] | null,
): {
	itemsList: MessageList;
	initialItemCount: number;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new MessageList());
	const reload = useCallback(() => setItemsList(new MessageList()), []);

	const getMessages = useEndpoint('GET', '/v1/livechat/:rid/messages', { rid: options.roomId });

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchMessages = useCallback(
		async (start: number, end: number) => {
			const { messages, total } = await getMessages({
				...(options.filter && { searchTerm: options.filter }),
				offset: start,
				count: end,
				sort: `{ "ts": 1 }`,
			});
			return {
				items: messages,
				itemCount: total,
			};
		},
		[getMessages, options.filter],
	);

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(
		itemsList,
		fetchMessages,
		useMemo(() => parseInt(`${getConfig('historyMessageListSize', 10)}`), []),
	);
	useStreamUpdatesForMessageList(itemsList, uid, options.roomId);

	return {
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
