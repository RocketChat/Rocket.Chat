import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { ISubscription } from '@rocket.chat/core-typings';
import { useMethod, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
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

export type SearchRenderableItem = {
	_id: string;
	t: string;
	name: string;
	rid?: string;
	fname?: string;
	avatarETag?: string;
	teamMain?: boolean;
	uids?: string[];
	prid?: string;
	unread: number;
	userMentions: number;
	groupMentions: number;
	u: ISubscription['u'];
	alert?: boolean;
	tunread?: string[];
	tunreadUser?: string[];
	hideUnreadStatus?: true;
	hideMentionStatus?: true;
	ts?: Date;
	status?: string;
	inviter?: ISubscription['inviter'];
};

export const useSearchItems = (filterText: string): UseQueryResult<SearchRenderableItem[], Error> => {
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

	const localRooms = useUserSubscriptions(query, options);

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

	const getSpotlight = useMethod('spotlight');

	return useQuery({
		queryKey: ['sidebar/search/spotlight', name, usernamesFromClient, type, localRooms.map(({ _id, name }) => _id + name)],

		queryFn: async (): Promise<SearchRenderableItem[]> => {
			if (localRooms.length === LIMIT) {
				return localRooms;
			}

			const spotlight = await getSpotlight(name, usernamesFromClient, type);

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
			}): SearchRenderableItem => ({
				_id: user._id,
				t: 'd',
				name: user.username,
				fname: user.name,
				avatarETag: user.avatarETag,
				u: { _id: user._id, username: user.username, name: user.name },
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
			});

			const roomMap = (room: {
				_id: string;
				name: string;
				t: string;
				teamMain?: boolean;
				fname?: string;
				avatarETag?: string;
				uids?: string[];
			}): SearchRenderableItem => ({
				...room,
				u: { _id: '', username: '' as const, name: '' },
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
			});

			const resultsFromServer: SearchRenderableItem[] = [];
			resultsFromServer.push(...spotlight.users.filter(filterUsersUnique).filter(usersFilter).map(userMap));
			resultsFromServer.push(...spotlight.rooms.filter(roomFilter).map(roomMap));

			const exact = resultsFromServer?.filter((item) => [item.name, item.fname].includes(name));
			return Array.from(new Set([...exact, ...localRooms, ...resultsFromServer]));
		},

		staleTime: 60_000,
		placeholderData: (previousData) => previousData ?? localRooms,
	});
};
