import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TeamsPanelState = {
	open: boolean;
	/** Team ids in the order the user arranged them; empty until the first move, which keeps the teams alphabetical. */
	teamsOrder: string[];
	show: () => void;
	close: () => void;
	/** Swaps a team with its neighbor, given the team ids in the order they are shown. */
	moveTeam: (currentKeys: string[], key: string, direction: 'up' | 'down') => void;
};

/**
 * Whether the sidebar shows the Teams panel instead of the room list, and the order of its teams. Opening a room keeps
 * the panel open, so the user stays in the team they navigated from; both survive a reload.
 */
export const teamsPanelStore = create<TeamsPanelState>()(
	persist(
		(set) => ({
			open: false,
			teamsOrder: [],
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
		}),
		{
			name: 'sidebarRail.teamsPanel',
			storage: createJSONStorage(() => localStorage),
			partialize: ({ open, teamsOrder }) => ({ open, teamsOrder }),
		},
	),
);
