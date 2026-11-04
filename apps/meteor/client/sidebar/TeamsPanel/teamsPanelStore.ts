import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TeamUnreadOptions = {
	/** A collapsed team keeps showing its unread rooms. */
	showUnreads?: boolean;
	/** Unread rooms come first in the team. */
	keepUnreadsOnTop?: boolean;
};

type TeamsPanelState = {
	open: boolean;
	/** Team ids in the order the user arranged them; empty until the first move, which keeps the teams alphabetical. */
	teamsOrder: string[];
	/** The Unreads options of each team, by team id, as Inbox categories have them. */
	teamsUnreads: Record<string, TeamUnreadOptions>;
	show: () => void;
	close: () => void;
	/** Swaps a team with its neighbor, given the team ids in the order they are shown. */
	moveTeam: (currentKeys: string[], key: string, direction: 'up' | 'down') => void;
	setTeamUnreads: (key: string, option: keyof TeamUnreadOptions, value: boolean) => void;
};

/**
 * Whether the sidebar shows the Teams panel instead of the room list, the order of its teams and their Unreads options. Opening a room keeps
 * the panel open, so the user stays in the team they navigated from; all of it survives a reload.
 */
export const teamsPanelStore = create<TeamsPanelState>()(
	persist(
		(set) => ({
			open: false,
			teamsOrder: [],
			teamsUnreads: {},
			show: () => set({ open: true }),
			close: () => set({ open: false }),
			moveTeam: (currentKeys, key, direction) => {
				const index = currentKeys.indexOf(key);
				const target = direction === 'up' ? index - 1 : index + 1;

				if (index === -1 || target < 0 || target >= currentKeys.length) {
					return;
				}

				const teamsOrder = [...currentKeys];
				[teamsOrder[index], teamsOrder[target]] = [teamsOrder[target], teamsOrder[index]];
				set({ teamsOrder });
			},
			setTeamUnreads: (key, option, value) =>
				set(({ teamsUnreads }) => ({ teamsUnreads: { ...teamsUnreads, [key]: { ...teamsUnreads[key], [option]: value } } })),
		}),
		{
			name: 'sidebarRail.teamsPanel',
			storage: createJSONStorage(() => localStorage),
			partialize: ({ open, teamsOrder, teamsUnreads }) => ({ open, teamsOrder, teamsUnreads }),
		},
	),
);
