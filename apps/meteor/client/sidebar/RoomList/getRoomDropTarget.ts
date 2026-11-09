import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { FAVORITES_TARGET } from '../categories/hooks/useUserSidebarCategories';

export type DropRoom = Pick<SubscriptionWithRoom, 't' | 'f' | 'category' | 'teamMain' | 'prid'>;

type RoomDropContext = {
	customCategoryIds: string[];
	groupKeys: string[];
	isFavoritesEnabled: boolean;
};

const getSystemGroupKey = (room: DropRoom) => {
	if (room.teamMain) {
		return 'Teams';
	}
	if (room.prid) {
		return 'Discussions';
	}
	if (room.t === 'c' || room.t === 'p') {
		return 'Channels';
	}
	if (room.t === 'd') {
		return 'Direct_Messages';
	}
	return undefined;
};

const getSystemGroup = (room: DropRoom, groupKeys: string[]) => {
	const key = getSystemGroupKey(room);
	return key && groupKeys.includes(key) ? key : 'Conversations';
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
