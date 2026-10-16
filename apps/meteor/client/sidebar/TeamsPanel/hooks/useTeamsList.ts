import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useSortQueryOptions } from '../../../hooks/useSortQueryOptions';
import type { GroupUnreadInfo } from '../../hooks/useRoomList';
import { buildUnreadInfo, emptyUnreadInfo, isUnreadRoom } from '../../hooks/useRoomList';
import type { TeamUnreadOptions } from '../teamsPanelStore';
import { teamsPanelStore } from '../teamsPanelStore';

const query = { open: { $ne: false } };

export type SidebarTeam = {
	key: string;
	title: string;
	main: SubscriptionWithRoom;
	/** Rows to render under the team header: the main room first, then the team's other joined rooms. */
	rooms: SubscriptionWithRoom[];
	expanded: boolean;
	unreadOptions: TeamUnreadOptions;
	/** Accounts only for what a collapsed team hides; an expanded team's rooms carry their own counters. */
	unreadInfo: GroupUnreadInfo;
};

const getRoomTitle = (room: { fname?: string; name?: string }) => room.fname || room.name || '';

/**
 * Teams are alphabetical until the user moves one; then they follow the saved order, and teams joined afterwards go
 * at the end, alphabetically. Activity in a team's rooms never moves the team, so the panel doesn't reshuffle while
 * the user reads it.
 */
export const sortTeams = <T extends { key: string; title: string }>(teams: T[], order: string[]) => {
	const position = new Map(order.map((key, index) => [key, index]));
	const rank = (key: string) => position.get(key) ?? order.length;

	return [...teams].sort((a, b) => rank(a.key) - rank(b.key) || a.title.localeCompare(b.title));
};

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
	const teamsOrder = teamsPanelStore((state) => state.teamsOrder);

	return useMemo(() => {
		const teams = new Map<string, { main?: SubscriptionWithRoom; rooms: SubscriptionWithRoom[] }>();

		// Subscriptions arrive sorted by the user's preference, which orders the rooms inside each team.
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

		return sortTeams(list, teamsOrder);
	}, [subscriptions, teamsOrder]);
};

export type TeamSubscriptions = ReturnType<typeof useTeamSubscriptions>;

export const useTeamsList = ({
	teams,
	expandedTeams,
	filterText = '',
	teamsUnreads = {},
}: {
	teams: TeamSubscriptions;
	expandedTeams: string[];
	filterText?: string;
	teamsUnreads?: Record<string, TeamUnreadOptions>;
}) =>
	useMemo<SidebarTeam[]>(() => {
		const text = filterText.trim().toLocaleLowerCase();

		return teams.flatMap(({ key, title, main, rooms }) => {
			const allRooms = [main, ...rooms];
			const unreadOptions = teamsUnreads[key] ?? {};

			if (text) {
				// A team that matches by name keeps all its rooms; otherwise only the matching rooms are kept.
				const visibleRooms = matches(main, text) ? allRooms : rooms.filter((room) => matches(room, text));

				if (!visibleRooms.length) {
					return [];
				}

				return [
					{
						key,
						title,
						main,
						rooms: visibleRooms,
						expanded: true,
						unreadOptions,
						unreadInfo: emptyUnreadInfo(),
					},
				];
			}

			const expanded = expandedTeams.includes(key);
			// As in Inbox categories: "Always display" keeps a collapsed team's unread rooms in view, and "Keep on top"
			// puts unread rooms first, each part keeping the user's sort.
			const isVisibleWhileCollapsed = (room: SubscriptionWithRoom) => Boolean(unreadOptions.showUnreads) && isUnreadRoom(room);
			let visibleRooms = expanded ? allRooms : allRooms.filter(isVisibleWhileCollapsed);

			if (unreadOptions.keepUnreadsOnTop) {
				visibleRooms = [...visibleRooms.filter(isUnreadRoom), ...visibleRooms.filter((room) => !isUnreadRoom(room))];
			}

			return [
				{
					key,
					title,
					main,
					rooms: visibleRooms,
					expanded,
					unreadOptions,
					// The rooms in view carry their own counters, so the header only adds up the ones it hides.
					unreadInfo: expanded ? emptyUnreadInfo() : buildUnreadInfo(allRooms.filter((room) => !isVisibleWhileCollapsed(room))),
				},
			];
		});
	}, [teams, expandedTeams, filterText, teamsUnreads]);

/** The unread state of every room in every team, for the Teams item in the rail. */
export const useTeamsUnreadInfo = () => {
	const teams = useTeamSubscriptions();

	return useMemo(() => buildUnreadInfo(teams.flatMap(({ main, rooms }) => [main, ...rooms])), [teams]);
};
