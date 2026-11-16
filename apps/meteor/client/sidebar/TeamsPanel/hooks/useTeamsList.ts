import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useSortQueryOptions } from '../../../hooks/useSortQueryOptions';
import type { GroupUnreadInfo } from '../../lib/unreadRooms';
import { buildUnreadInfo, emptyUnreadInfo, isUnreadRoom } from '../../lib/unreadRooms';
import type { TeamUnreadOptions } from '../teamsPanelStore';
import { teamsPanelStore } from '../teamsPanelStore';

const query = { open: { $ne: false } };

export type TeamSubscriptions = {
	key: string;
	title: string;
	main: SubscriptionWithRoom;
	rooms: SubscriptionWithRoom[];
};

export type SidebarTeam = {
	key: string;
	title: string;
	main: SubscriptionWithRoom;
	rooms: SubscriptionWithRoom[];
	expanded: boolean;
	unreadOptions: TeamUnreadOptions;
	unreadInfo: GroupUnreadInfo;
};

const getRoomTitle = (room: { fname?: string; name?: string }) => room.fname || room.name || '';

export const sortTeams = <T extends { key: string; title: string }>(teams: T[], order: string[]): T[] => {
	const position = new Map(order.map((key, index) => [key, index]));
	const rank = (key: string) => position.get(key) ?? order.length;

	return [...teams].sort((a, b) => rank(a.key) - rank(b.key) || a.title.localeCompare(b.title));
};

export const useTeamSubscriptions = (): TeamSubscriptions[] => {
	const options = useSortQueryOptions();
	const subscriptions = useUserSubscriptions(query, options);
	const teamsOrder = teamsPanelStore((state) => state.teamsOrder);

	return useMemo(() => {
		const teams = new Map<string, { main?: SubscriptionWithRoom; rooms: SubscriptionWithRoom[] }>();

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

		return sortTeams(
			[...teams.entries()].flatMap(([key, { main, rooms }]) => (main ? [{ key, title: getRoomTitle(main), main, rooms }] : [])),
			teamsOrder,
		);
	}, [subscriptions, teamsOrder]);
};

const matchesFilter = (room: { fname?: string; name?: string }, text: string) =>
	[room.fname, room.name].some((name) => name?.toLowerCase().includes(text));

export const useTeamsList = ({
	teams,
	expandedTeams,
	filterText = '',
	teamsUnreads = {},
}: {
	teams: TeamSubscriptions[];
	expandedTeams: string[];
	filterText?: string;
	teamsUnreads?: Record<string, TeamUnreadOptions>;
}): SidebarTeam[] =>
	useMemo(() => {
		const text = filterText.trim().toLowerCase();

		return teams.flatMap(({ key, title, main, rooms }) => {
			const allRooms = [main, ...rooms];
			const unreadOptions = teamsUnreads[key] ?? {};

			if (text) {
				const matchingRooms = matchesFilter(main, text) ? allRooms : rooms.filter((room) => matchesFilter(room, text));

				return matchingRooms.length
					? [{ key, title, main, rooms: matchingRooms, expanded: true, unreadOptions, unreadInfo: emptyUnreadInfo() }]
					: [];
			}

			const expanded = expandedTeams.includes(key);
			const isVisibleWhileCollapsed = (room: SubscriptionWithRoom) => Boolean(unreadOptions.showUnreads) && isUnreadRoom(room);
			const visibleRooms = expanded ? allRooms : allRooms.filter(isVisibleWhileCollapsed);

			return [
				{
					key,
					title,
					main,
					rooms: unreadOptions.keepUnreadsOnTop
						? [...visibleRooms.filter(isUnreadRoom), ...visibleRooms.filter((room) => !isUnreadRoom(room))]
						: visibleRooms,
					expanded,
					unreadOptions,
					unreadInfo: expanded ? emptyUnreadInfo() : buildUnreadInfo(allRooms.filter((room) => !isVisibleWhileCollapsed(room))),
				},
			];
		});
	}, [teams, expandedTeams, filterText, teamsUnreads]);
