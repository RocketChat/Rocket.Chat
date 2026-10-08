import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { TeamSubscriptions } from './useTeamsList';
import { teamsQueryKeys } from '../../../lib/queryKeys';

export type TeamUnjoinedRoom = Pick<IRoom, '_id' | 't' | 'name' | 'fname' | 'teamId' | 'avatarETag'>;

// A team holds at most 100 rooms, so a single page always has all of them.
const TEAM_ROOMS_LIMIT = 100;

// Keeps the combined result stable between renders while none of the queries changed.
const combineData = (results: { data?: TeamUnjoinedRoom[] }[]) => results.map(({ data }) => data);

/**
 * The public rooms of each expanded team that the user has not joined yet.
 *
 * The subscription store only knows the rooms the user joined, so the rest of a team's rooms come from the same
 * endpoint as the "Team channels" contextual bar. They are only requested for the teams the user expands. Joining
 * one creates its subscription, which moves it to the joined rooms right away; rooms added to the team later show
 * up on the next refetch.
 *
 * Private rooms are left out even when the user is allowed to list them (`view-all-team-channels`), since they
 * can only be opened by their members.
 */
export const useTeamUnjoinedRooms = (teams: TeamSubscriptions, expandedTeams: string[]) => {
	const listTeamRooms = useEndpoint('GET', '/v1/teams.listRooms');

	const expanded = useMemo(() => teams.filter(({ key }) => expandedTeams.includes(key)), [teams, expandedTeams]);

	const teamRooms = useQueries({
		queries: expanded.map(({ key }) => ({
			queryKey: teamsQueryKeys.sidebarRooms(key),
			queryFn: async () => {
				const { rooms } = await listTeamRooms({ teamId: key, offset: 0, count: TEAM_ROOMS_LIMIT });
				return rooms.map(({ _id, t, name, fname, teamId, avatarETag }): TeamUnjoinedRoom => ({ _id, t, name, fname, teamId, avatarETag }));
			},
			staleTime: 60_000,
		})),
		combine: combineData,
	});

	return useMemo(() => {
		const byTeam = new Map<string, TeamUnjoinedRoom[]>();

		expanded.forEach(({ key, main, rooms }, index) => {
			const joined = new Set([main.rid, ...rooms.map(({ rid }) => rid)]);

			byTeam.set(
				key,
				(teamRooms[index] ?? [])
					.filter((room) => room.t === 'c' && !joined.has(room._id))
					.sort((a, b) => (a.fname || a.name || '').localeCompare(b.fname || b.name || '')),
			);
		});

		return byTeam;
	}, [expanded, teamRooms]);
};
