import { create } from 'zustand';

export type SidebarRailPanel = 'inbox' | 'search' | 'calls' | 'filters';

type SidebarRailState = {
	panel: SidebarRailPanel;
	previousPanel: SidebarRailPanel;
	searchText: string;
	setPanel: (panel: SidebarRailPanel) => void;
	returnToPreviousPanel: () => void;
	closeCalls: () => void;
	setSearchText: (searchText: string) => void;
};

// Which panel the sidebar shows while the rail is on, and the search text kept across panel switches.
export const useSidebarRailStore = create<SidebarRailState>()((set) => ({
	panel: 'inbox',
	previousPanel: 'inbox',
	searchText: '',
	setPanel: (panel) => set((state) => (state.panel === panel ? state : { panel, previousPanel: state.panel })),
	returnToPreviousPanel: () => set((state) => ({ panel: state.previousPanel, previousPanel: 'inbox' })),
	// The calls panel only exists while its route is open, so leaving the route must not leave it reachable.
	closeCalls: () =>
		set((state) => ({
			panel: state.panel === 'calls' ? 'inbox' : state.panel,
			previousPanel: state.previousPanel === 'calls' ? 'inbox' : state.previousPanel,
		})),
	setSearchText: (searchText) => set({ searchText }),
}));
