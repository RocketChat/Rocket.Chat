import type { IMessage } from '@rocket.chat/core-typings';
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

const filter = (message: IMessage): message is IMessage => {
	return message._hidden !== true;
};

const compare = (a: IMessage, b: IMessage): number => a.ts.getTime() - b.ts.getTime();

export const useHistoryMessageList = ({ roomId, filter: searchTerm }: HistoryMessageListOptions) => {
	const getMessages = useEndpoint('GET', '/v1/livechat/:rid/messages', { rid: roomId });

	const count = parseInt(`${getConfig('historyMessageListSize', 10)}`, 10);

	useInfiniteMessageQueryUpdates({
		queryKey: omnichannelQueryKeys.contactMessages(roomId, { searchTerm }),
		roomId,
		filter,
		compare,
	});

	return useInfiniteQuery({
		queryKey: omnichannelQueryKeys.contactMessages(roomId, { searchTerm }),
		queryFn: async ({ pageParam: offset }) => {
			const { messages, total } = await getMessages({
				...(searchTerm && { searchTerm }),
				offset,
				count,
				sort: `{ "ts": 1 }`,
			});
			return {
				items: messages.map(mapMessageFromApi).filter(filter).toSorted(compare),
				itemCount: total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			const loadedItemsCount = allPages.reduce((acc, page) => acc + page.items.length, 0);
			return loadedItemsCount < lastPage.itemCount ? loadedItemsCount : undefined;
		},
		select: ({ pages }) => ({
			// FIXME: This is an estimation, as messages can be created or removed while paginating
			// Ideally, the server should return the next offset to use or the pagination should be done using "createdAt" or "updatedAt"
			items: pages.flatMap((page) => page.items),
			itemCount: pages.at(-1)?.itemCount ?? 0,
		}),
	});
};
