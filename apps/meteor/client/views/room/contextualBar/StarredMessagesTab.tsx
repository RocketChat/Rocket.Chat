import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';
import { roomsQueryKeys } from '../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const COUNT = 50;

const StarredMessagesTab = () => {
	const getStarredMessages = useEndpoint('GET', '/v1/chat.getStarredMessages');

	const room = useRoom();

	const starredMessagesQueryResult = useInfiniteQuery({
		queryKey: roomsQueryKeys.starredMessages(room._id),
		queryFn: async ({ pageParam }) => {
			const result = await getStarredMessages({ roomId: room._id, offset: pageParam, count: COUNT });
			const processedMessages = await Promise.all(result.messages.map(mapMessageFromApi).map(onClientMessageReceived));
			return {
				messages: processedMessages,
				total: result.total,
				count: result.count,
				offset: pageParam,
			};
		},

		initialPageParam: 0,

		getNextPageParam: (lastPage) => {
			const nextOffset = lastPage.offset + lastPage.count;
			return nextOffset < lastPage.total ? nextOffset : undefined;
		},
	});

	const messages = useMemo(
		() => starredMessagesQueryResult.data?.pages.flatMap((page) => page.messages) ?? [],
		[starredMessagesQueryResult.data],
	);

	const handleEndReached = useCallback(() => {
		if (starredMessagesQueryResult.hasNextPage && !starredMessagesQueryResult.isFetching) {
			starredMessagesQueryResult.fetchNextPage();
		}
	}, [starredMessagesQueryResult]);

	const { t } = useTranslation();

	return (
		<MessageListTab
			iconName='star'
			title={t('Starred_Messages')}
			emptyResultMessage={t('No_starred_messages')}
			context='starred'
			messages={messages}
			isLoading={starredMessagesQueryResult.isLoading}
			isSuccess={starredMessagesQueryResult.isSuccess}
			isFetchingNextPage={starredMessagesQueryResult.isFetchingNextPage}
			onEndReached={handleEndReached}
		/>
	);
};

export default StarredMessagesTab;
