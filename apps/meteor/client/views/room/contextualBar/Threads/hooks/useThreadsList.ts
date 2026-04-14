import type { IThreadMainMessage, IMessage, ISubscription } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useInfiniteMessageQueryUpdates } from '../../../../../hooks/useInfiniteMessageQueryUpdates';
import { roomsQueryKeys } from '../../../../../lib/queryKeys';
import { getConfig } from '../../../../../lib/utils/getConfig';
import { mapMessageFromApi } from '../../../../../lib/utils/mapMessageFromApi';

type ThreadsListOptions =
	| {
			rid: IMessage['rid'];
			text?: string;
			type: 'unread';
			tunread: ISubscription['tunread'];
	  }
	| {
			rid: IMessage['rid'];
			text?: string;
			type: 'following';
			tunread?: never;
	  }
	| {
			rid: IMessage['rid'];
			text?: string;
			type?: undefined;
			tunread?: never;
	  };

export const useThreadsList = ({ rid, text, type, tunread }: ThreadsListOptions) => {
	const getThreadsList = useEndpoint('GET', '/v1/chat.getThreadsList');

	const count = parseInt(`${getConfig('threadsListSize', 10)}`, 10);

	const userId = useUserId();

	useInfiniteMessageQueryUpdates({
		queryKey: roomsQueryKeys.threads(rid, { type, text }),
		roomId: rid,
		// Replicates the filtering done server-side
		filter: (message): message is IThreadMainMessage => {
			if (typeof message.tcount !== 'number') {
				return false;
			}

			if (type === 'following') {
				if (!userId || !message.replies?.includes(userId)) {
					return false;
				}
			}

			if (type === 'unread') {
				if (!tunread?.includes(message._id)) {
					return false;
				}
			}

			if (text) {
				const regex = new RegExp(escapeRegExp(text), 'i');
				if (!regex.test(message.msg)) {
					return false;
				}
			}

			return true;
		},
		// Replicates the sorting done server-side
		compare: (a, b) => (b.tlm ?? b.ts).getTime() - (a.tlm ?? a.ts).getTime(),
	});

	return useInfiniteQuery({
		queryKey: roomsQueryKeys.threads(rid, { type, text }),
		queryFn: async ({ pageParam: offset }) => {
			const { threads, total } = await getThreadsList({
				rid,
				type,
				text,
				offset,
				count,
			});

			return {
				items: threads.map(mapMessageFromApi) as IThreadMainMessage[],
				itemCount: total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			// FIXME: This is an estimation, as threads can be created or removed while paginating
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
