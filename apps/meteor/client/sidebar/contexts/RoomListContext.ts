import type { KeyboardEvent } from 'react';
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
 * Everything a room list needs to be drawn, and nothing about how to draw it. None of it is fetched by
 * whoever reads it — which is what lets a second sidebar render from a fixture, or from this same
 * provider with a shape of its own.
 */
export type RoomListContextValue = {
	groups: SidebarRoomListGroup[];
	presentation: SidebarPresentation;
	collapse: RoomListCollapse;
	viewer: RoomListViewer;
	actions: RoomListActions;
};

/**
 * Everything says "nothing yet": no groups, nobody looking, and actions that do nothing.
 *
 * A default that threw would make every story supply the whole value to render a corner of it, and a
 * default that fetched would be the coupling this split exists to remove.
 */
export const defaultRoomListContextValue: RoomListContextValue = {
	groups: [],
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

export const RoomListContext = createContext<RoomListContextValue>(defaultRoomListContextValue);

export const useRoomListContext = (): RoomListContextValue => useContext(RoomListContext);

export const useRoomListGroups = (): SidebarRoomListGroup[] => useContext(RoomListContext).groups;
export const useRoomListPresentation = (): SidebarPresentation => useContext(RoomListContext).presentation;
export const useRoomListCollapse = (): RoomListCollapse => useContext(RoomListContext).collapse;
export const useRoomListViewer = (): RoomListViewer => useContext(RoomListContext).viewer;
export const useRoomListActions = (): RoomListActions => useContext(RoomListContext).actions;
