import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { useTranslation, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useLocalSearchIndexVersion } from './useLocalSearchIndexChanges';
import { MAX_LOCAL_SEARCH_LIMIT, searchLocalIndex } from '../../../../../lib/e2eeSearch/searchLocalIndex';
import { Messages, Users } from '../../../../../stores';
import { useRoom } from '../../../contexts/RoomContext';

const indexIds = new WeakMap<ISearchIndexBackend, number>();
let lastIndexId = 0;

/** A number for each open of the index: the session gives each open its own backend object. */
const indexIdOf = (backend: ISearchIndexBackend): number => {
	let id = indexIds.get(backend);
	if (id === undefined) {
		id = ++lastIndexId;
		indexIds.set(backend, id);
	}
	return id;
};

// Looks only at data that the client already has, so a `from:` filter sends no request that names the author.
const findLoadedUid = (rid: string, username: string) =>
	Users.state.find((user) => user.username?.toLowerCase() === username)?._id ??
	Messages.state.find((message) => message.rid === rid && message.u?.username?.toLowerCase() === username)?.u._id;

/** The list was full at the limit, so more hits may exist, and the hits are of this limit (no placeholder). */
export const canLoadMoreLocalHits = (query: { isSuccess: boolean; isPlaceholderData: boolean; data?: unknown[] }, limit: number): boolean =>
	query.isSuccess && !query.isPlaceholderData && (query.data?.length ?? 0) >= limit && limit < MAX_LOCAL_SEARCH_LIMIT;

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
	const user = useUser();
	const t = useTranslation();
	// The search runs again each time the index changes, so it finds the messages that the indexing adds while it is shown.
	const indexVersion = useLocalSearchIndexVersion();
	const indexId = backend ? indexIdOf(backend) : undefined;

	return useQuery({
		queryKey: [
			'rooms',
			room._id,
			'local-message-search',
			{ searchText, limit, uid: user?._id, utcOffset: user?.utcOffset, indexId, indexVersion },
		] as const,
		queryFn: ({ signal }) =>
			backend
				? searchLocalIndex(backend, {
						searchText,
						rid: room._id,
						limit,
						self: user ? { uid: user._id } : undefined,
						resolveUid: (username) => findLoadedUid(room._id, username),
						utcOffset: user?.utcOffset,
						signal,
					})
				: [],
		enabled: !!backend,
		// The hits stay on screen while the next ones load, but never the hits of another room or of another open of the index.
		placeholderData: (previous, previousQuery) =>
			previousQuery?.queryKey[1] === room._id && previousQuery.queryKey[3].indexId === indexId ? previous : undefined,
		// The results are decrypted text: keep them only while the panel shows them.
		gcTime: 0,
		meta: {
			errorToastMessage: t('Search_message_search_failed'),
		},
	});
};
