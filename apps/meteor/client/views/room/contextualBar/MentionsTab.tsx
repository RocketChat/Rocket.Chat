import type { IMessage } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const COUNT = 50;

const MentionsTab = (): ReactElement => {
	const getMentionedMessages = useEndpoint('GET', '/v1/chat.getMentionedMessages');

	const room = useRoom();

	const mentionedMessagesQueryResult = useInfiniteQuery({
		queryKey: ['rooms', room._id, 'mentioned-messages'] as const,

		queryFn: async ({ pageParam }) => {
			const result = await getMentionedMessages({ roomId: room._id, offset: pageParam, count: COUNT });
			return {
				messages: result.messages.map(mapMessageFromApi),
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
		() => mentionedMessagesQueryResult.data?.pages.flatMap((page) => page.messages) ?? [],
		[mentionedMessagesQueryResult.data],
	);

	const handleEndReached = useCallback(() => {
		if (mentionedMessagesQueryResult.hasNextPage && !mentionedMessagesQueryResult.isFetching) {
			mentionedMessagesQueryResult.fetchNextPage();
		}
	}, [mentionedMessagesQueryResult]);

	const { t } = useTranslation();

	return (
		<MessageListTab
			iconName='at'
			title={t('Mentions')}
			emptyResultMessage={t('No_mentions_found')}
			context='mentions'
			messages={messages}
			isLoading={mentionedMessagesQueryResult.isLoading}
			isSuccess={mentionedMessagesQueryResult.isSuccess}
			isFetchingNextPage={mentionedMessagesQueryResult.isFetchingNextPage}
			onEndReached={handleEndReached}
		/>
	);
};

export default MentionsTab;
