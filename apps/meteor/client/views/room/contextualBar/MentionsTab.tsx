import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery, type UseQueryResult } from '@tanstack/react-query';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MessageListTab from './MessageListTab';
import { mapMessageFromApi } from '../../../lib/utils/mapMessageFromApi';
import { useRoom } from '../contexts/RoomContext';

const MentionsTab = (): ReactElement => {
	const getMentionedMessages = useEndpoint('GET', '/v1/chat.getMentionedMessages');

	const room = useRoom();

	const mentionedMessagesQueryResult = useInfiniteQuery({
		queryKey: ['rooms', room._id, 'mentioned-messages'] as const,
		queryFn: async ({ pageParam = 0 }) => {
			const result = await getMentionedMessages({
				roomId: room._id,
				offset: pageParam,
			});

			return {
				messages: result.messages.map(mapMessageFromApi),
				count: result.count,
				total: result.total,
			};
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages) => {
			// If we got fewer messages than requested, we've reached the end
			if (lastPage.count === 0 || lastPage.messages.length === 0) {
				return undefined;
			}
			// Calculate the next offset based on total loaded messages
			const loadedCount = allPages.reduce((acc, page) => acc + page.messages.length, 0);
			return loadedCount;
		},
		select: ({ pages }) => ({
			pages,
			messages: pages.flatMap((page) => page.messages),
		}),
	});

	// Transform infinite query result to match MessageListTab's expected format
	const transformedQueryResult = {
		data: mentionedMessagesQueryResult.data?.messages ?? [],
		isLoading: mentionedMessagesQueryResult.isLoading,
		isSuccess: mentionedMessagesQueryResult.isSuccess,
		isError: mentionedMessagesQueryResult.isError,
		error: mentionedMessagesQueryResult.error ?? null,
	} as unknown as UseQueryResult<IMessage[]>;

	const { t } = useTranslation();

	return (
		<MessageListTab
			iconName='at'
			title={t('Mentions')}
			emptyResultMessage={t('No_mentions_found')}
			context='mentions'
			queryResult={transformedQueryResult}
			onLoadMore={() => {
				if (mentionedMessagesQueryResult.hasNextPage && !mentionedMessagesQueryResult.isFetchingNextPage) {
					mentionedMessagesQueryResult.fetchNextPage();
				}
			}}
			hasMore={mentionedMessagesQueryResult.hasNextPage}
		/>
	);
};

export default MentionsTab;
