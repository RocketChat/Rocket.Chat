import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import type { TeamSubscriptions } from './useTeamsList';
import { useOpenedRoom } from '../../../lib/RoomManager';

/**
 * Teams start collapsed and remember, per browser, which ones the user expanded.
 *
 * When a room inside a team is opened, that team is expanded so the open room is visible in the panel. This only
 * happens when the opened room changes, so the user can still collapse the team afterwards.
 */
export const useExpandedTeams = (teams: TeamSubscriptions) => {
	const [expandedTeams, setExpandedTeams] = useLocalStorage<string[]>('sidebarTeamsExpanded', []);
	const openedRoom = useOpenedRoom();
	const lastRevealedRoom = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (!openedRoom || lastRevealedRoom.current === openedRoom) {
			return;
		}

		const team = teams.find(({ main, rooms }) => main.rid === openedRoom || rooms.some(({ rid }) => rid === openedRoom));

		if (!team) {
			return;
		}

		lastRevealedRoom.current = openedRoom;

		if (!expandedTeams.includes(team.key)) {
			setExpandedTeams([...expandedTeams, team.key]);
		}
	}, [openedRoom, teams, expandedTeams, setExpandedTeams]);

	const toggleTeam = useCallback(
		(key: string) => {
			setExpandedTeams(expandedTeams.includes(key) ? expandedTeams.filter((item) => item !== key) : [...expandedTeams, key]);
		},
		[expandedTeams, setExpandedTeams],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent, key: string) => {
			const expanded = expandedTeams.includes(key);

			// Right and left arrows open and close a team, as in a tree view; Enter and Space toggle it.
			if (['Enter', 'Space'].includes(event.code) || (event.key === 'ArrowRight' && !expanded) || (event.key === 'ArrowLeft' && expanded)) {
				event.preventDefault();
				toggleTeam(key);
			}
		},
		[expandedTeams, toggleTeam],
	);

	return { expandedTeams, toggleTeam, handleKeyDown };
};
