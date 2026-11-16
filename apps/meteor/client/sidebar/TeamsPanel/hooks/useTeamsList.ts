import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useSortQueryOptions } from '../../../hooks/useSortQueryOptions';
import type { GroupUnreadInfo } from '../../lib/unreadRooms';
import { buildUnreadInfo, emptyUnreadInfo } from '../../lib/unreadRooms';

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
	unreadInfo: GroupUnreadInfo;
};

const getRoomTitle = (room: { fname?: string; name?: string }) => room.fname || room.name || '';

export const useTeamSubscriptions = (): TeamSubscriptions[] => {
	const options = useSortQueryOptions();
	const subscriptions = useUserSubscriptions(query, options);

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

		return [...teams.entries()]
			.flatMap(([key, { main, rooms }]) => (main ? [{ key, title: getRoomTitle(main), main, rooms }] : []))
			.sort((a, b) => a.title.localeCompare(b.title));
	}, [subscriptions]);
};

export const useTeamsList = ({ teams, expandedTeams }: { teams: TeamSubscriptions[]; expandedTeams: string[] }): SidebarTeam[] =>
	useMemo(
		() =>
			teams.map(({ key, title, main, rooms }) => {
				const allRooms = [main, ...rooms];
				const expanded = expandedTeams.includes(key);

				return {
					key,
					title,
					main,
					rooms: expanded ? allRooms : [],
					expanded,
					unreadInfo: expanded ? emptyUnreadInfo() : buildUnreadInfo(allRooms),
				};
			}),
		[teams, expandedTeams],
	);
