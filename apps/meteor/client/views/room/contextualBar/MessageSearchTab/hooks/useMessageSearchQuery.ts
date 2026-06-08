import type { ServerMethods } from '@rocket.chat/ddp-client';
import { useMethod, useSetting, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { useRoom } from '../../../contexts/RoomContext';

export type MessageSearchItem = NonNullable<Awaited<ReturnType<ServerMethods['rocketchatSearch.search']>>['message']>['docs'][number];

export const useMessageSearchQuery = ({ searchText, globalSearch }: { searchText: string; globalSearch: boolean }) => {
	const uid = useUserId();
	const room = useRoom();
	const pageSize = useSetting('PageSize', 10);

	const t = useTranslation();

	const searchMessages = useMethod('rocketchatSearch.search');
	return useInfiniteQuery({
		queryKey: ['rooms', room._id, 'message-search', { uid, rid: room._id, searchText, globalSearch }] as const,
		queryFn: async ({ pageParam: limit }) => {
			const result = await searchMessages(searchText, { uid, rid: room._id }, { limit, searchAll: globalSearch });
			const items = result.message?.docs ?? [];

			return {
				items,
				itemCount: items.length >= limit ? items.length + 1 : items.length,
			};
		},
		initialPageParam: pageSize,
		getNextPageParam: (lastPage, _allPages, lastPageParam) => {
			if (lastPage.items.length < lastPageParam) {
				return undefined;
			}

			return lastPageParam + pageSize;
		},
		select: ({ pages }) => pages.at(-1) ?? { items: [], itemCount: 0 },
		placeholderData: keepPreviousData,
		meta: {
			errorToastMessage: t('Search_message_search_failed'),
		},
	});
};
