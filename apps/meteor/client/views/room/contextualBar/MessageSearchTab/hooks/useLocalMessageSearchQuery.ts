import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchLocalIndex } from '../../../../../lib/e2eeSearch/searchLocalIndex';
import { useRoom } from '../../../contexts/RoomContext';

export const useLocalMessageSearchQuery = ({
	backend,
	searchText,
	limit,
}: {
	backend: ISearchIndexBackend | undefined;
	searchText: string;
	limit: number;
}) => {
	const room = useRoom();
	const t = useTranslation();

	return useQuery({
		queryKey: ['rooms', room._id, 'local-message-search', { searchText, limit }] as const,
		queryFn: () => (backend ? searchLocalIndex(backend, { searchText, rid: room._id, limit }) : []),
		enabled: !!backend,
		placeholderData: keepPreviousData,
		// The results are decrypted text: keep them only while the panel shows them.
		gcTime: 0,
		meta: {
			errorToastMessage: t('Search_message_search_failed'),
		},
	});
};
