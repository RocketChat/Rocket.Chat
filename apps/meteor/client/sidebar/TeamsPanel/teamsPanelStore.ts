import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TeamUnreadOptions = {
	showUnreads?: boolean;
	keepUnreadsOnTop?: boolean;
};

type TeamsPanelState = {
	open: boolean;
	teamsOrder: string[];
	teamsUnreads: Record<string, TeamUnreadOptions>;
	expandedTeams: string[];
	show: () => void;
	close: () => void;
	moveTeam: (currentKeys: string[], key: string, direction: 'up' | 'down') => void;
	setTeamUnreads: (key: string, option: keyof TeamUnreadOptions, value: boolean) => void;
	toggleTeam: (key: string) => void;
	expandTeam: (key: string) => void;
};

export const teamsPanelStore = create<TeamsPanelState>()(
	persist(
		(set) => ({
			open: false,
			teamsOrder: [],
			teamsUnreads: {},
			expandedTeams: [],
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
			toggleTeam: (key) =>
				set(({ expandedTeams }) => ({
					expandedTeams: expandedTeams.includes(key) ? expandedTeams.filter((item) => item !== key) : [...expandedTeams, key],
				})),
			expandTeam: (key) => set((state) => (state.expandedTeams.includes(key) ? state : { expandedTeams: [...state.expandedTeams, key] })),
		}),
		{
			name: 'sidebarRail.teamsPanel',
			storage: createJSONStorage(() => localStorage),
			partialize: ({ open, teamsOrder, teamsUnreads, expandedTeams }) => ({ open, teamsOrder, teamsUnreads, expandedTeams }),
		},
	),
);
