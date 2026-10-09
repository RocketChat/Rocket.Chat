import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TeamsPanelState = {
	open: boolean;
	show: () => void;
	close: () => void;
};

/**
 * Whether the sidebar shows the Teams panel instead of the room list. Opening a room keeps the panel open, so the
 * user stays in the team they navigated from; the choice also survives a reload.
 */
export const teamsPanelStore = create<TeamsPanelState>()(
	persist(
		(set) => ({
			open: false,
			show: () => set({ open: true }),
			close: () => set({ open: false }),
		}),
		{
			name: 'sidebarRail.teamsPanel',
			storage: createJSONStorage(() => localStorage),
			partialize: ({ open }) => ({ open }),
		},
	),
);
