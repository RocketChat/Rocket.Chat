import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { TeamUnjoinedRoom } from './useTeamUnjoinedRooms';
import { useSortQueryOptions } from '../../../hooks/useSortQueryOptions';
import type { GroupUnreadInfo } from '../../hooks/useRoomList';
import { buildUnreadInfo, emptyUnreadInfo } from '../../hooks/useRoomList';

const query = { open: { $ne: false } };

export type SidebarTeam = {
	key: string;
	title: string;
	main: SubscriptionWithRoom;
	/** Rows to render under the team header: the main room first, then the team's other joined rooms. */
	rooms: SubscriptionWithRoom[];
	/** Public rooms of the team the user has not joined, listed after the joined ones while the team is expanded. */
	unjoinedRooms: TeamUnjoinedRoom[];
	expanded: boolean;
	/** Accounts only for what a collapsed team hides; an expanded team's rooms carry their own counters. */
	unreadInfo: GroupUnreadInfo;
};

const getRoomTitle = (room: { fname?: string; name?: string }) => room.fname || room.name || '';

const matches = (room: { fname?: string; name?: string }, text: string) => getRoomTitle(room).toLocaleLowerCase().includes(text);

/**
 * Groups the user's joined rooms by team, reading from the realtime subscription store.
 *
 * Only teams whose main room the user is subscribed to are listed: being a team member means being subscribed to
 * its main room, and without it there is no team name to show.
 */
export const useTeamSubscriptions = () => {
	const options = useSortQueryOptions();
	const subscriptions = useUserSubscriptions(query, options);
	const sortBy = useUserPreference<'activity' | 'alphabetical'>('sidebarSortby');

	return useMemo(() => {
		const teams = new Map<string, { main?: SubscriptionWithRoom; rooms: SubscriptionWithRoom[] }>();

		// Subscriptions arrive already sorted by the user's preference, so with "activity" a team is placed by its
		// most recently active room, which is the first one of the team to show up here.
		subscriptions.forEach((subscription) => {
			if (!subscription.teamId) {
				return;
			}

			const team = teams.get(subscription.teamId) ?? { rooms: [] };

			if (subscription.teamMain) {
				team.main = subscription;
			} else {
				team.rooms.push(subscription);
			}

			teams.set(subscription.teamId, team);
		});

		const list = [...teams.entries()]
			.filter((entry): entry is [string, { main: SubscriptionWithRoom; rooms: SubscriptionWithRoom[] }] => Boolean(entry[1].main))
			.map(([key, { main, rooms }]) => ({ key, title: getRoomTitle(main), main, rooms }));

		if (sortBy !== 'activity') {
			list.sort((a, b) => a.title.localeCompare(b.title));
		}

		return list;
	}, [subscriptions, sortBy]);
};

export type TeamSubscriptions = ReturnType<typeof useTeamSubscriptions>;

export const useTeamsList = ({
	teams,
	expandedTeams,
	unjoinedRooms,
	filterText = '',
}: {
	teams: TeamSubscriptions;
	expandedTeams: string[];
	unjoinedRooms?: Map<string, TeamUnjoinedRoom[]>;
	filterText?: string;
}) =>
	useMemo<SidebarTeam[]>(() => {
		const text = filterText.trim().toLocaleLowerCase();

		return teams.flatMap(({ key, title, main, rooms }) => {
			const allRooms = [main, ...rooms];
			const allUnjoinedRooms = unjoinedRooms?.get(key) ?? [];

			if (text) {
				// A team that matches by name keeps all its rooms; otherwise only the matching rooms are kept.
				const teamMatches = matches(main, text);
				const visibleRooms = teamMatches ? allRooms : rooms.filter((room) => matches(room, text));
				const visibleUnjoinedRooms = teamMatches ? allUnjoinedRooms : allUnjoinedRooms.filter((room) => matches(room, text));

				if (!visibleRooms.length && !visibleUnjoinedRooms.length) {
					return [];
				}

				return [
					{
						key,
						title,
						main,
						rooms: visibleRooms,
						unjoinedRooms: visibleUnjoinedRooms,
						expanded: true,
						unreadInfo: emptyUnreadInfo(),
					},
				];
			}

			const expanded = expandedTeams.includes(key);

			return [
				{
					key,
					title,
					main,
					rooms: expanded ? allRooms : [],
					unjoinedRooms: expanded ? allUnjoinedRooms : [],
					expanded,
					unreadInfo: expanded ? emptyUnreadInfo() : buildUnreadInfo(allRooms),
				},
			];
		});
	}, [teams, expandedTeams, unjoinedRooms, filterText]);

/** The unread state of every room in every team, for the Teams item in the rail. */
export const useTeamsUnreadInfo = () => {
	const teams = useTeamSubscriptions();

	return useMemo(() => buildUnreadInfo(teams.flatMap(({ main, rooms }) => [main, ...rooms])), [teams]);
};
