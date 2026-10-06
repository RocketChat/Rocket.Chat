import { create } from 'zustand';

export type SidebarRailPanel = 'inbox' | 'search' | 'calls';

type SidebarRailState = {
	panel: SidebarRailPanel;
	searchText: string;
	setPanel: (panel: SidebarRailPanel) => void;
	setSearchText: (searchText: string) => void;
};

// Which panel the sidebar shows while the rail is on, and the search text kept across panel switches.
export const useSidebarRailStore = create<SidebarRailState>()((set) => ({
	panel: 'inbox',
	searchText: '',
	setPanel: (panel) => set({ panel }),
	setSearchText: (searchText) => set({ searchText }),
}));
