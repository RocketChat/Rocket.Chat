import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../hooks/useCategoryList';

export type ReorderableGroup = { key: string };

/**
 * Whether a group is this reader's to move, and to where. Dynamic groups appear and disappear on
 * their own, so they neither move nor count as a place to move past.
 */
export const canMoveGroup = (groups: ReorderableGroup[], index: number, direction: 'up' | 'down'): boolean => {
	if (SIDEBAR_DYNAMIC_GROUP_KEYS.includes(groups[index].key)) {
		return false;
	}

	if (direction === 'down') {
		return index + 1 < groups.length;
	}

	return groups.slice(0, index).some((group) => !SIDEBAR_DYNAMIC_GROUP_KEYS.includes(group.key));
};
