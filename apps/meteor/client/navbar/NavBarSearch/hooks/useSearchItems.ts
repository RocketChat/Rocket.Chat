import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getConfig } from '../../../lib/utils/getConfig';

const LIMIT = parseInt(String(getConfig('Sidebar_Search_Spotlight_LIMIT', 20)));

const options = {
	sort: {
		lm: -1,
		name: 1,
	},
	limit: LIMIT,
} as const;

export const useSearchItems = (filterText: string): { items: SubscriptionWithRoom[]; isLoading: boolean } => {
	const [, mention, name] = useMemo(() => filterText.match(/(@|#)?(.*)/i) || [], [filterText]);

	const query = useMemo(() => {
		const filterRegex = new RegExp(escapeRegExp(name), 'i');

		return {
			$or: [{ name: filterRegex }, { fname: filterRegex }],
			...(mention && {
				t: mention === '@' ? 'd' : { $ne: 'd' },
			}),
		};
	}, [name, mention]);

	// Local cached subscriptions are matched against the *immediate* filter text so joined
	// rooms show up instantly, without waiting for the debounce or the server response.
	const localRooms = useUserSubscriptions(query, options);

	// Only the server spotlight call is debounced — the local results above stay instant.
	const debouncedName = useDebouncedValue(name, 500);

	const usernamesFromClient = [...localRooms?.map(({ t, name }) => (t === 'd' ? name : null))].filter(Boolean) as string[];

	const searchForChannels = mention === '#';
	const searchForDMs = mention === '@';

	const type = useMemo(() => {
		if (searchForChannels) {
			return { users: false, rooms: true, includeFederatedRooms: true };
		}
		if (searchForDMs) {
			return { users: true, rooms: false };
		}
		return { users: true, rooms: true, includeFederatedRooms: true };
	}, [searchForChannels, searchForDMs]);

	const getSpotlight = useEndpoint('GET', '/v1/spotlight');

	const { data: serverResults, isFetching } = useQuery({
		// Keyed on the debounced term only, so typing doesn't refetch on every keystroke.
		queryKey: ['sidebar/search/spotlight', debouncedName, mention, type],

		// When local subscriptions already fill the limit there's nothing more to fetch.
		enabled: localRooms.length < LIMIT,

		queryFn: async () => {
			const spotlight = await getSpotlight({
				query: debouncedName,
				usernames: usernamesFromClient.join(','),
				type: JSON.stringify(type),
			});

			const filterUsersUnique = ({ _id }: { _id: string }, index: number, arr: { _id: string }[]): boolean =>
				index === arr.findIndex((user) => _id === user._id);

			const roomFilter = (room: { t: string; uids?: string[]; _id: string; name?: string }): boolean =>
				!localRooms.find(
					(item) =>
						(room.t === 'd' && room.uids && room.uids.length > 1 && room.uids?.includes(item._id)) ||
						[item.rid, item._id].includes(room._id),
				);
			const usersFilter = (user: { _id: string }): boolean =>
				!localRooms.find((room) => room.t === 'd' && room.uids && room.uids?.length === 2 && room.uids.includes(user._id));

			const userMap = (user: {
				_id: string;
				name: string;
				username: string;
				avatarETag?: string;
			}): {
				_id: string;
				t: string;
				name: string;
				fname: string;
				avatarETag?: string;
			} => ({
				_id: user._id,
				t: 'd',
				name: user.username,
				fname: user.name,
				avatarETag: user.avatarETag,
			});

			type resultsFromServerType = {
				_id: string;
				t: string;
				name: string;
				teamMain?: boolean;
				fname?: string;
				avatarETag?: string | undefined;
				uids?: string[] | undefined;
			}[];

			const resultsFromServer: resultsFromServerType = [];
			resultsFromServer.push(...spotlight.users.filter(filterUsersUnique).filter(usersFilter).map(userMap));
			resultsFromServer.push(...spotlight.rooms.filter(roomFilter));

			return resultsFromServer;
		},

		staleTime: 60_000,
		// Keep the previous server results visible while a new search is in flight.
		placeholderData: (previousData) => previousData,
	});

	// Merge reactively (outside the query) so local results render the instant the user types
	// and server results fold in — deduped — once they arrive.
	const items = useMemo(() => {
		// Server results are keyed on the *debounced* term, so while the user is still typing
		// (or via placeholderData) they may belong to a previous search. Drop the ones that no
		// longer match the current text so stale, non-matching results aren't rendered.
		const filterRegex = new RegExp(escapeRegExp(name), 'i');
		const matchesFilter = ({ name, fname }: { name?: string; fname?: string }) =>
			(name && filterRegex.test(name)) || (fname && filterRegex.test(fname));

		const fromServer = (serverResults ?? []).filter(matchesFilter);
		const exact = fromServer.filter((item) => [item.name, item.fname].includes(name));
		return Array.from(new Set([...exact, ...localRooms, ...fromServer])) as SubscriptionWithRoom[];
	}, [serverResults, localRooms, name]);

	return { items, isLoading: isFetching };
};
