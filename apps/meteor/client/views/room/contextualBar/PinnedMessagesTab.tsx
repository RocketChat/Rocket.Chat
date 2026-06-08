import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const COUNT = 50;

const PinnedMessagesTab = (): ReactElement => {
	const getPinnedMessages = useEndpoint('GET', '/v1/chat.getPinnedMessages');

	const room = useRoom();

	const pinnedMessagesQueryResult = useInfiniteQuery({
		queryKey: ['rooms', room._id, 'pinned-messages'] as const,

		queryFn: async ({ pageParam }) => {
			const result = await getPinnedMessages({ roomId: room._id, offset: pageParam, count: COUNT });
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
		() => pinnedMessagesQueryResult.data?.pages.flatMap((page) => page.messages) ?? [],
		[pinnedMessagesQueryResult.data],
	);

	const handleEndReached = useCallback(() => {
		if (pinnedMessagesQueryResult.hasNextPage && !pinnedMessagesQueryResult.isFetching) {
			pinnedMessagesQueryResult.fetchNextPage();
		}
	}, [pinnedMessagesQueryResult]);

	const { t } = useTranslation();

	return (
		<MessageListTab
			iconName='pin'
			title={t('Pinned_Messages')}
			emptyResultMessage={t('No_pinned_messages')}
			context='pinned'
			messages={messages}
			isLoading={pinnedMessagesQueryResult.isLoading}
			isSuccess={pinnedMessagesQueryResult.isSuccess}
			isFetchingNextPage={pinnedMessagesQueryResult.isFetchingNextPage}
			onEndReached={handleEndReached}
		/>
	);
};

export default PinnedMessagesTab;
