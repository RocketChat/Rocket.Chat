import type { QueryKey } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';

import { videoConferenceQueryKeys } from './queryKeys';

const ROOM_ID = 'room-id';
const CALL_ID = 'call-id';

// A link change re-reads the room's links only; the Calls history and an open call window must not refetch for it,
// nor the links for theirs.
const otherKeys: [string, QueryKey][] = [
	['fromRoom', videoConferenceQueryKeys.fromRoom(ROOM_ID)],
	['conference', videoConferenceQueryKeys.conference(CALL_ID)],
	['join', videoConferenceQueryKeys.join(CALL_ID)],
	['joinable', videoConferenceQueryKeys.joinable()],
	['capabilities', videoConferenceQueryKeys.capabilities()],
];

const prime = (queryClient: QueryClient, queryKey: QueryKey) => queryClient.setQueryData(queryKey, 'data');

const isInvalidated = (queryClient: QueryClient, queryKey: QueryKey) => queryClient.getQueryState(queryKey)?.isInvalidated;

it.each(otherKeys)('keeps the persistent rooms of a room apart from every other video conference key (%s)', async (_name, otherKey) => {
	const persistentRooms = videoConferenceQueryKeys.persistentRooms(ROOM_ID);

	const queryClient = new QueryClient();
	prime(queryClient, persistentRooms);
	prime(queryClient, otherKey);

	await queryClient.invalidateQueries({ queryKey: otherKey });

	expect(isInvalidated(queryClient, persistentRooms)).toBe(false);

	const reverse = new QueryClient();
	prime(reverse, persistentRooms);
	prime(reverse, otherKey);

	await reverse.invalidateQueries({ queryKey: persistentRooms });

	expect(isInvalidated(reverse, otherKey)).toBe(false);
});
