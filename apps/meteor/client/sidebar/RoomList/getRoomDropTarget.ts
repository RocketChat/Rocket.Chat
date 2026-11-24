import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { FAVORITES_TARGET } from '../categories/hooks/useUserSidebarCategories';

export type DropRoom = Pick<SubscriptionWithRoom, 't' | 'f' | 'category' | 'teamMain' | 'prid'>;

type RoomDropContext = {
	customCategoryIds: string[];
	groupKeys: string[];
	isFavoritesEnabled: boolean;
};

// Same precedence as getRoomCategory, so the group found is the one the room is listed in once it leaves its category.
const getSystemGroup = (room: DropRoom, groupKeys: string[]) => {
	const candidates = [
		room.teamMain && 'Teams',
		room.prid && 'Discussions',
		(room.t === 'c' || room.t === 'p') && 'Channels',
		room.t === 'd' && 'Direct_Messages',
	];
	return candidates.find((key): key is string => !!key && groupKeys.includes(key)) ?? 'Conversations';
};

/**
 * Tells where dropping a room on a sidebar group moves it: into a custom category or Favorites, out of its category (`null`),
 * or nowhere (`undefined`) when the drop would not change where the room belongs.
 */
export const getRoomDropTarget = (
	room: DropRoom,
	sourceGroup: string,
	targetGroup: string,
	{ customCategoryIds, groupKeys, isFavoritesEnabled }: RoomDropContext,
): string | null | undefined => {
	if (targetGroup === sourceGroup || room.t === 'l') {
		return undefined;
	}

	// A room listed in a dynamic group can be dropped on the category it already belongs to.
	if (targetGroup === room.category || (targetGroup === 'Favorites' && room.f)) {
		return undefined;
	}

	if (targetGroup === 'Favorites' && isFavoritesEnabled) {
		return FAVORITES_TARGET;
	}

	if (customCategoryIds.includes(targetGroup)) {
		return targetGroup;
	}

	// Dropping on the room's own system group takes it out of its category.
	if ((room.category || room.f) && targetGroup === getSystemGroup(room, groupKeys)) {
		return null;
	}

	return undefined;
};
