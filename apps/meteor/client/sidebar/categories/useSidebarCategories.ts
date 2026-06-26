import { useCallback, useMemo, useSyncExternalStore } from 'react';

import type { SidebarCategory } from './SidebarCategoriesStore';
import { sidebarCategories } from './SidebarCategoriesStore';

export type UseSidebarCategoriesReturn = {
	categories: SidebarCategory[];
	createCategory: (name: string, rooms?: string[]) => string;
	deleteCategory: (id: string) => void;
	addChannelsToCategory: (id: string, rooms: string[]) => void;
	setCategoryChannels: (id: string, rooms: string[]) => void;
	removeChannelFromCategories: (rid: string) => void;
	/** Maps a room id to the category that contains it, for fast lookups. */
	categoryByRoom: Map<string, string>;
};

export const useSidebarCategories = (): UseSidebarCategoriesReturn => {
	const categories = useSyncExternalStore(sidebarCategories.subscribe, sidebarCategories.getSnapshot);

	const categoryByRoom = useMemo(() => {
		const map = new Map<string, string>();
		categories.forEach((category) => category.rooms.forEach((rid) => map.set(rid, category._id)));
		return map;
	}, [categories]);

	const createCategory = useCallback((name: string, rooms?: string[]) => sidebarCategories.create(name, rooms), []);
	const deleteCategory = useCallback((id: string) => sidebarCategories.remove(id), []);
	const addChannelsToCategory = useCallback((id: string, rooms: string[]) => sidebarCategories.addRooms(id, rooms), []);
	const setCategoryChannels = useCallback((id: string, rooms: string[]) => sidebarCategories.setRooms(id, rooms), []);
	const removeChannelFromCategories = useCallback((rid: string) => sidebarCategories.removeRoom(rid), []);

	return {
		categories,
		createCategory,
		deleteCategory,
		addChannelsToCategory,
		setCategoryChannels,
		removeChannelFromCategories,
		categoryByRoom,
	};
};
