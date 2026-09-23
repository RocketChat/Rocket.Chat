import type { KeyboardEvent, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { SidebarPresentation } from '../hooks/useSidebarPresentation';
import type { SidebarRoomListGroup } from '../lib/sidebarGroups';

export type RoomListCollapse = {
	keys: string[];
	toggle: (group: string) => void;
	onKeyDown: (event: KeyboardEvent, group: string) => void;
};

/** What the workspace and this reader have settled, read once rather than once per row. */
export type RoomListViewer = {
	userId?: string;
	isAnonymous: boolean;
	openedRoom: string;
	isPriorityEnabled: boolean;
	/** Whether this workspace lets its readers arrange their own groups. */
	canCustomiseGroups: boolean;
	formatTime: (time: string | Date | number) => string;
};

export type RoomListActions = {
	moveCategory: (currentKeys: string[], key: string, direction: 'up' | 'down') => Promise<void>;
};

/**
 * Everything a room list needs that does not change as messages arrive: how this reader wants it
 * drawn, what is folded, who is looking, and what the list can be asked to do.
 */
export type RoomListSettings = {
	presentation: SidebarPresentation;
	collapse: RoomListCollapse;
	viewer: RoomListViewer;
	actions: RoomListActions;
};

/**
 * Everything says "nothing yet": nobody looking, and actions that do nothing.
 *
 * A default that threw would make every story supply the whole value to render a corner of it, and a
 * default that fetched would be the coupling this split exists to remove.
 */
export const defaultRoomListSettings: RoomListSettings = {
	presentation: {
		viewMode: 'extended',
		extended: true,
		showAvatar: true,
		rowHeight: 48,
		ItemTemplate: (() => null) as unknown as SidebarPresentation['ItemTemplate'],
		AvatarTemplate: null,
	},
	collapse: { keys: [], toggle: () => undefined, onKeyDown: () => undefined },
	viewer: { isAnonymous: true, openedRoom: '', isPriorityEnabled: false, canCustomiseGroups: false, formatTime: () => '' },
	actions: { moveCategory: async () => undefined },
};

const RoomListSettingsContext = createContext<RoomListSettings>(defaultRoomListSettings);

/**
 * The groups are kept apart from the settings because they change every time a message arrives, and a
 * single value would redraw everyone reading any part of it for something only the list cares about.
 */
const RoomListGroupsContext = createContext<SidebarRoomListGroup[]>([]);

export const RoomListContextProvider = ({
	settings,
	groups,
	children,
}: {
	settings: RoomListSettings;
	groups: SidebarRoomListGroup[];
	children: ReactNode;
}) => (
	<RoomListSettingsContext.Provider value={settings}>
		<RoomListGroupsContext.Provider value={groups}>{children}</RoomListGroupsContext.Provider>
	</RoomListSettingsContext.Provider>
);

export const useRoomListGroups = (): SidebarRoomListGroup[] => useContext(RoomListGroupsContext);
export const useRoomListPresentation = (): SidebarPresentation => useContext(RoomListSettingsContext).presentation;
export const useRoomListCollapse = (): RoomListCollapse => useContext(RoomListSettingsContext).collapse;
export const useRoomListViewer = (): RoomListViewer => useContext(RoomListSettingsContext).viewer;
export const useRoomListActions = (): RoomListActions => useContext(RoomListSettingsContext).actions;
