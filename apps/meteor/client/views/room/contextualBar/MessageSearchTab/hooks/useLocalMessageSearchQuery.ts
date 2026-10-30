import type { E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supportsLocalSearch } from './useLocalSearchIndexBackend';
import { useLocalSearchIndexVersion } from './useLocalSearchIndexChanges';
import { MAX_LOCAL_SEARCH_LIMIT, searchLocalIndex } from '../../../../../lib/e2eeSearch/searchLocalIndex';
import { Messages, Users } from '../../../../../stores';
import { useRoom } from '../../../contexts/RoomContext';

const indexIds = new WeakMap<ISearchIndexBackend, number>();
let lastIndexId = 0;

const indexIdOf = (backend: ISearchIndexBackend): number => {
	let id = indexIds.get(backend);
	if (id === undefined) {
		id = ++lastIndexId;
		indexIds.set(backend, id);
	}
	return id;
};

const findLoadedUid = (rid: string, username: string) =>
	Users.state.find((user) => user.username?.toLowerCase() === username)?._id ??
	Messages.state.find((message) => message.rid === rid && message.u?.username?.toLowerCase() === username)?.u._id;

export const canLoadMoreLocalHits = (query: { isSuccess: boolean; isPlaceholderData: boolean; data?: unknown[] }, limit: number): boolean =>
	query.isSuccess && !query.isPlaceholderData && (query.data?.length ?? 0) >= limit && limit < MAX_LOCAL_SEARCH_LIMIT;

export const useLocalMessageSearchQuery = ({
	backend,
	openResult,
	searchText,
	limit,
}: {
	backend: ISearchIndexBackend | undefined;
	openResult: E2EESearchOpenResult | undefined;
	searchText: string;
	limit: number;
}) => {
	const room = useRoom();
	const user = useUser();
	const { t } = useTranslation();
	const indexVersion = useLocalSearchIndexVersion(backend);
	const indexId = backend ? indexIdOf(backend) : undefined;

	return useQuery({
		queryKey: [
			'rooms',
			room._id,
			'local-message-search',
			{ searchText, limit, uid: user?._id, utcOffset: user?.utcOffset, indexId, indexVersion },
		] as const,
		queryFn: ({ signal }) =>
			backend && openResult
				? searchLocalIndex(backend, {
						openResult,
						searchText,
						rid: room._id,
						limit,
						self: user ? { uid: user._id } : undefined,
						resolveUid: (username) => findLoadedUid(room._id, username),
						utcOffset: user?.utcOffset,
						signal,
					})
				: [],
		enabled: supportsLocalSearch(backend, openResult),
		placeholderData: (previous, previousQuery) => {
			const previousParams = previousQuery?.queryKey[3];
			return previousParams &&
				previousQuery?.queryKey[1] === room._id &&
				previousParams.indexId === indexId &&
				previousParams.uid === user?._id &&
				previousParams.searchText === searchText &&
				previousParams.utcOffset === user?.utcOffset &&
				previousParams.indexVersion === indexVersion
				? previous
				: undefined;
		},
		gcTime: 0,
		meta: { errorToastMessage: t('Search_message_search_failed') },
	});
};
