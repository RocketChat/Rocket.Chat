import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableMessageList } from '../../../../hooks/lists/useScrollableMessageList';
import { useComponentDidUpdate } from '../../../../hooks/useComponentDidUpdate';
import { MessageList } from '../../../../lib/lists/MessageList';

type HistoryMessageListOptions = {
	filter: string;
	roomId: string;
};

export const useHistoryMessageList = (
	options: HistoryMessageListOptions,
): {
	itemsList: MessageList;
	initialItemCount: number;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new MessageList());
	const reload = useCallback(() => setItemsList(new MessageList()), []);

	const getMessages = useEndpoint('GET', `/v1/livechat/${options.roomId}/messages`);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchMessages = useCallback(
		async (start, end) => {
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

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(itemsList, fetchMessages, 25);

	return {
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
