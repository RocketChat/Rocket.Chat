import type { IMessage } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useInfiniteMessageQueryUpdates } from '../../../../hooks/useInfiniteMessageQueryUpdates';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';
import { getConfig } from '../../../../lib/utils/getConfig';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';

type HistoryMessageListOptions = {
	filter: string;
	roomId: string;
};

export const useHistoryMessageList = ({ roomId, filter: searchTerm }: HistoryMessageListOptions) => {
	const getMessages = useEndpoint('GET', '/v1/livechat/:rid/messages', { rid: roomId });

	const count = parseInt(`${getConfig('historyMessageListSize', 10)}`, 10);

	useInfiniteMessageQueryUpdates({
		queryKey: omnichannelQueryKeys.contactMessages(roomId, { searchTerm }),
		roomId,
		// Replicates the filtering done server-side
		filter: (message): message is IMessage =>
			(!('t' in message) || message.t === 'livechat-close') &&
			(!searchTerm || new RegExp(escapeRegExp(searchTerm), 'ig').test(message.msg)),
		// Replicates the sorting forced on server-side
		compare: (a, b) => a.ts.getTime() - b.ts.getTime(),
	});

	return useInfiniteQuery({
		queryKey: omnichannelQueryKeys.contactMessages(roomId, { searchTerm }),
		queryFn: async ({ pageParam: offset }) => {
			const { messages, total } = await getMessages({
				...(searchTerm && { searchTerm }),
				offset,
				count,
				sort: JSON.stringify({ ts: 1 }),
			});

			return {
				items: messages.map(mapMessageFromApi),
				itemCount: total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			// FIXME: This is an estimation, as messages can be created or removed while paginating
			// Ideally, the server should return the next offset to use or the pagination should be done using "createdAt" or "updatedAt"
			const loadedItemsCount = allPages.reduce((acc, page) => acc + page.items.length, 0);
			return loadedItemsCount < lastPage.itemCount ? loadedItemsCount : undefined;
		},
		select: ({ pages }) => ({
			items: pages.flatMap((page) => page.items),
			itemCount: pages.at(-1)?.itemCount ?? 0,
		}),
	});
};
