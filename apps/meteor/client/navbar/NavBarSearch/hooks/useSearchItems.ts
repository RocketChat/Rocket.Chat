import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { UnifiedSearchIntelligentResult, UnifiedSearchMessageResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { getConfig } from '../../../lib/utils/getConfig';

const LIMIT = parseInt(String(getConfig('Sidebar_Search_Spotlight_LIMIT', 20)));

const options = {
	sort: {
		lm: -1,
		name: 1,
	},
	limit: LIMIT,
} as const;

type SearchRoom = Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'teamMain'> & {
	uids?: string[];
	avatarETag?: string;
};

type SearchUser = Pick<IUser, '_id' | 'name' | 'username' | 'avatarETag'>;

export type NavBarSearchSections = {
	recent: SubscriptionWithRoom[];
	users: SubscriptionWithRoom[];
	rooms: SearchRoom[];
	messages: UnifiedSearchMessageResult[];
	intelligent: UnifiedSearchIntelligentResult[];
	meta: {
		globalMessagesEnabled: boolean;
		intelligentSearchEnabled: boolean;
		intelligentSearchConfigured: boolean;
		answerGenerationConfigured: boolean;
		hasIntelligentSearchLicense: boolean;
		showIntelligentSearch: boolean;
	};
};

const emptySections = (recent: SubscriptionWithRoom[], hasLicense: boolean, showIntelligentSearch: boolean): NavBarSearchSections => ({
	recent,
	users: [],
	rooms: [],
	messages: [],
	intelligent: [],
	meta: {
		globalMessagesEnabled: false,
		intelligentSearchEnabled: false,
		intelligentSearchConfigured: false,
		answerGenerationConfigured: false,
		hasIntelligentSearchLicense: hasLicense,
		showIntelligentSearch,
	},
});

const mapUserToRoom = (user: SearchUser): SubscriptionWithRoom =>
	({
		_id: user._id,
		t: 'd',
		name: user.username,
		fname: user.name,
		avatarETag: user.avatarETag,
	}) as SubscriptionWithRoom;

const mapSubscriptionToSearchRoom = ({ rid, _id, t, name, fname, teamMain }: SubscriptionWithRoom): SearchRoom => ({
	_id: rid || _id,
	t,
	name,
	fname,
	teamMain,
});

const mapSubscriptionToSearchUser = ({ _id, name, fname, avatarETag }: SubscriptionWithRoom): SubscriptionWithRoom =>
	({
		_id,
		t: 'd',
		name,
		fname,
		avatarETag,
	}) as SubscriptionWithRoom;

export const useSearchItems = (filterText: string): UseQueryResult<NavBarSearchSections, Error> => {
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

	const usernamesFromClient = localRooms.map(({ t, name }) => (t === 'd' ? name : null)).filter(Boolean) as string[];

	const searchForChannels = mention === '#';
	const searchForDMs = mention === '@';

	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');
	const globalSearchEnabled = useSetting('Search.defaultProvider.GlobalSearchEnabled', false);
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const showIntelligentSearch = useSetting('AI_Intelligent_Search_Show_In_Top_Bar', true);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule('chat.rocket.rc-ai');

	return useQuery({
		queryKey: [
			'sidebar/search/unified',
			name,
			usernamesFromClient,
			searchForChannels,
			searchForDMs,
			globalSearchEnabled,
			intelligentSearchEnabled,
			hasIntelligentSearchLicense,
			showIntelligentSearch,
			localRooms.map(({ _id, name }) => _id + name),
		],

		queryFn: async () => {
			const localUserResults = searchForChannels ? [] : localRooms.filter(({ t }) => t === 'd').map(mapSubscriptionToSearchUser);
			const localRoomResults = searchForDMs ? [] : localRooms.filter(({ t }) => t !== 'd').map(mapSubscriptionToSearchRoom);
			const base = {
				...emptySections(name.trim() ? [] : localRooms, hasIntelligentSearchLicense, showIntelligentSearch),
				users: localUserResults,
				rooms: localRoomResults,
			};

			if (!name.trim() || localRooms.length === LIMIT) {
				return base;
			}

			const result = await unifiedSearch({
				query: name,
				count: LIMIT,
				includeMessages: Boolean(globalSearchEnabled && !mention),
				includeIntelligent: Boolean(hasIntelligentSearchLicense && intelligentSearchEnabled && showIntelligentSearch && !mention),
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

			const users = searchForChannels
				? []
				: [...localUserResults, ...result.users.filter(filterUsersUnique).filter(usersFilter).map(mapUserToRoom)];
			const rooms = searchForDMs ? [] : [...localRoomResults, ...(result.rooms as SearchRoom[]).filter(roomFilter)];

			return {
				recent: localRooms,
				users,
				rooms,
				messages: result.messages,
				intelligent: result.intelligent,
				meta: {
					...result.meta,
					hasIntelligentSearchLicense,
					showIntelligentSearch,
				},
			};
		},

		staleTime: 60_000,
		placeholderData: (previousData) => previousData ?? emptySections(localRooms, hasIntelligentSearchLicense, showIntelligentSearch),
	});
};
