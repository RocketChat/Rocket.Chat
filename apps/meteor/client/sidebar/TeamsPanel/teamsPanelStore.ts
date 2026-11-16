import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TeamsPanelState = {
	open: boolean;
	expandedTeams: string[];
	show: () => void;
	close: () => void;
	toggleTeam: (key: string) => void;
};

export const teamsPanelStore = create<TeamsPanelState>()(
	persist(
		(set) => ({
			open: false,
			expandedTeams: [],
			show: () => set({ open: true }),
			close: () => set({ open: false }),
			toggleTeam: (key) =>
				set(({ expandedTeams }) => ({
					expandedTeams: expandedTeams.includes(key) ? expandedTeams.filter((item) => item !== key) : [...expandedTeams, key],
				})),
		}),
		{
			name: 'sidebarRail.teamsPanel',
			storage: createJSONStorage(() => localStorage),
			partialize: ({ open, expandedTeams }) => ({ open, expandedTeams }),
		},
	),
);
