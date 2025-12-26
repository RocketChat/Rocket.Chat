import type { IDiscussionMessage, IMessage } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useInfiniteMessageQueryUpdates } from '../../../../hooks/useInfiniteMessageQueryUpdates';
import { roomsQueryKeys } from '../../../../lib/queryKeys';
import { getConfig } from '../../../../lib/utils/getConfig';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';

const isDiscussionMessageInRoom = (message: IMessage, rid: IMessage['rid']): message is IDiscussionMessage =>
	message.rid === rid && 'drid' in message;

const isDiscussionTextMatching = (discussionMessage: IDiscussionMessage, regex: RegExp): boolean => regex.test(discussionMessage.msg);

export const useDiscussionsList = ({ rid, text }: { rid: IMessage['rid']; text?: string }) => {
	const getDiscussions = useEndpoint('GET', '/v1/chat.getDiscussions');

	const count = parseInt(`${getConfig('discussionListSize', 10)}`, 10);

	useInfiniteMessageQueryUpdates<IDiscussionMessage, ReturnType<typeof roomsQueryKeys.discussions>>({
		queryKey: roomsQueryKeys.discussions(rid, { text }),
		roomId: rid,
		// Replicates the filtering done server-side
		filter: (message): message is IDiscussionMessage => {
			if (!isDiscussionMessageInRoom(message, rid)) {
				return false;
			}

			if (text) {
				const regex = new RegExp(escapeRegExp(text), 'i');
				if (!isDiscussionTextMatching(message, regex)) {
					return false;
				}
			}

			return true;
		},
	});

	return useInfiniteQuery({
		queryKey: roomsQueryKeys.discussions(rid, { text }),
		queryFn: async ({ pageParam: offset }) => {
			const { messages, total } = await getDiscussions({
				roomId: rid,
				text,
				offset,
				count,
			});

			return {
				items: messages.map(mapMessageFromApi),
				itemCount: total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			// FIXME: This is an estimation, as discussions can be created or removed while paginating
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
