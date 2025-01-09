import { useMethod, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useRoom } from '../../../contexts/RoomContext';

export const useMessageSearchQuery = ({
	searchText,
	limit,
	globalSearch,
}: {
	searchText: string;
	limit: number;
	globalSearch: boolean;
}) => {
	const uid = useUserId() ?? undefined;
	const room = useRoom();

	const t = useTranslation();

	const searchMessages = useMethod('rocketchatSearch.search');
	return useQuery({
		queryKey: ['rooms', room._id, 'message-search', { uid, rid: room._id, searchText, limit, globalSearch }] as const,

		queryFn: async () => {
			const result = await searchMessages(searchText, { uid, rid: room._id }, { limit, searchAll: globalSearch });
			return result.message?.docs ?? [];
		},
		placeholderData: keepPreviousData,
		meta: {
			errorToastMessage: t('Search_message_search_failed'),
		},
	});
};
