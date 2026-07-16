import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { isTruthy } from '@rocket.chat/tools';
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

type AISearchRoomResult = {
	_id: string;
	name: string;
	fname?: string;
	t: string;
	rid?: string;
	status?: string;
	avatarETag?: string;
	outside?: boolean;
	uids?: string[];
};

export const useAISearchRooms = (filterText = ''): { items: SubscriptionWithRoom[]; isLoading: boolean } => {
	const [, mention, name] = useMemo(() => filterText.match(/(@|#)?(.*)/i) || [], [filterText]);

	const query = useMemo(() => {
		const filterRegex = new RegExp(escapeRegExp(name), 'i');

		return {
			...(mention && {
				t: mention === '@' ? 'd' : { $ne: 'd' },
			}),
			$or: [{ name: filterRegex }, { fname: filterRegex }],
		};
	}, [name, mention]);

	const localRooms = useUserSubscriptions(query, options);
	const debouncedName = useDebouncedValue(name, 500);
	const usernamesFromClient = localRooms.map(({ t, name }) => (t === 'd' ? name : null)).filter(isTruthy);
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
		queryKey: ['sidebar/ai-search/spotlight', debouncedName, mention, type],
		enabled: localRooms.length < LIMIT,
		queryFn: async () => {
			const spotlight = await getSpotlight({
				query: debouncedName,
				usernames: usernamesFromClient.join(','),
				type: JSON.stringify(type),
			});

			const filterUsersUnique = ({ _id }: { _id: string }, index: number, users: { _id: string }[]): boolean =>
				index === users.findIndex((user) => _id === user._id);
			const userMap = (user: { _id: string; name: string; username: string; status?: string }): AISearchRoomResult => ({
				_id: user._id,
				name: user.username,
				fname: user.name,
				t: 'd',
				rid: user._id,
				status: user.status,
			});
			const results: AISearchRoomResult[] = spotlight.users.filter(filterUsersUnique).map(userMap);
			results.push(...spotlight.rooms);

			return results;
		},
		staleTime: 60_000,
	});

	const items = useMemo(() => {
		const filterRegex = new RegExp(escapeRegExp(name), 'i');
		const matchesFilter = ({ name, fname }: { name?: string; fname?: string }) =>
			(name && filterRegex.test(name)) || (fname && filterRegex.test(fname));
		const isLocalDuplicate = (item: { _id: string; t?: string; uids?: string[]; name: string }): boolean =>
			localRooms.some((room) => {
				const sameRoom = [room.rid, room._id].includes(item._id);
				const sameGroupDM = item.t === 'd' && !!item.uids && item.uids.length > 1 && item.uids.includes(room._id);
				const sameDirectDM = item.t === 'd' && room.t === 'd' && !!room.uids && room.uids.length === 2 && room.uids.includes(item._id);
				const sameUserDM = item.t === 'd' && room.t === 'd' && item.name === room.name;
				return sameRoom || sameGroupDM || sameDirectDM || sameUserDM;
			});

		const candidates = name === debouncedName && localRooms.length < LIMIT ? (serverResults ?? []) : [];
		const fromServer = candidates.filter((item) => matchesFilter(item) && !isLocalDuplicate(item));
		const exact = fromServer.filter((item) => [item.name, item.fname].includes(name));

		return [...exact, ...localRooms, ...fromServer.filter((item) => !exact.includes(item))] as SubscriptionWithRoom[];
	}, [debouncedName, localRooms, name, serverResults]);

	const isLoading = isFetching && serverResults === undefined;

	return { items, isLoading };
};
