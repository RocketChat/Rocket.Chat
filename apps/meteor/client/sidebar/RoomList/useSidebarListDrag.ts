import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useSetting } from '@rocket.chat/ui-contexts';

import { useIsEnterprise } from '../../hooks/useIsEnterprise';
import { useItemListDrag } from '../../hooks/useItemListDrag';
import type { ItemListDragSource, ItemListDropHover, ItemListDropTarget } from '../../hooks/useItemListDrag';
import { useMoveRoomCategory } from '../categories/hooks/useMoveRoomCategory';
import { useSaveCategoryOrder } from '../categories/hooks/useSaveCategoryOrder';
import { FAVORITES_TARGET, useUserSidebarCategories } from '../categories/hooks/useUserSidebarCategories';
import { SIDEBAR_DYNAMIC_GROUP_KEYS } from '../hooks/useCategoryList';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';

const isDynamicGroup = (key: string) => SIDEBAR_DYNAMIC_GROUP_KEYS.includes(key);

const getSystemGroup = (room: SubscriptionWithRoom, groupKeys: string[]) => {
	const key = room.teamMain
		? 'Teams'
		: room.prid
			? 'Discussions'
			: room.t === 'c' || room.t === 'p'
				? 'Channels'
				: room.t === 'd'
					? 'Direct_Messages'
					: undefined;

	return key && groupKeys.includes(key) ? key : 'Conversations';
};

const moveKey = (keys: string[], key: string, target: string, position: 'before' | 'after') => {
	const rest = keys.filter((k) => k !== key);
	const index = rest.indexOf(target) + (position === 'after' ? 1 : 0);
	return [...rest.slice(0, index), key, ...rest.slice(index)];
};

/**
 * Lets the sidebar categories be reordered by dragging their headers, and a room be dragged into another category.
 */
export const useSidebarListDrag = (groups: SidebarRoomListGroup[]) => {
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const { customCategories } = useUserSidebarCategories();
	const isFavoritesEnabled = useSetting('Favorite_Rooms', true);
	const saveCategoryOrder = useSaveCategoryOrder();
	const moveRoomCategory = useMoveRoomCategory();

	const groupKeys = groups.map((group) => group.key);
	const findRoom = (rid: string) => groups.flatMap((group) => group.rooms).find((room) => room.rid === rid);

	const getRoomTarget = (source: ItemListDragSource, group: string) => {
		const room = findRoom(source.key);
		if (!room || group === source.group) {
			return undefined;
		}

		if (group === 'Favorites' && isFavoritesEnabled) {
			return FAVORITES_TARGET;
		}

		if (customCategories.some((category) => category._id === group)) {
			return group;
		}

		// Dropping on the room's own system group takes it out of its category.
		if ((room.category || room.f) && group === getSystemGroup(room, groupKeys)) {
			return null;
		}

		return undefined;
	};

	const resolveTarget = (source: ItemListDragSource, hover: ItemListDropHover): ItemListDropTarget | undefined => {
		if (source.kind === 'item') {
			return getRoomTarget(source, hover.group) === undefined ? undefined : { group: hover.group, position: 'inside' };
		}

		if (isDynamicGroup(hover.group) || hover.group === source.key) {
			return undefined;
		}

		const position = hover.half === 'top' ? 'before' : 'after';
		const reordered = moveKey(groupKeys, source.key, hover.group, position);
		if (reordered.every((key, index) => key === groupKeys[index])) {
			return undefined;
		}

		return { group: hover.group, position };
	};

	const onDrop = (source: ItemListDragSource, target: ItemListDropTarget) => {
		if (source.kind === 'group' && target.position !== 'inside') {
			void saveCategoryOrder(moveKey(groupKeys, source.key, target.group, target.position));
			return;
		}

		const room = findRoom(source.key);
		const categoryTarget = getRoomTarget(source, target.group);
		if (!room || categoryTarget === undefined) {
			return;
		}

		moveRoomCategory.mutate({
			room: { rid: room.rid, name: room.fname || room.name, isFavorite: !!room.f, categoryId: room.category },
			target: categoryTarget ?? undefined,
		});
	};

	return useItemListDrag({
		disabled: !isEnterprise,
		canDrag: (source) => source.kind === 'item' || !isDynamicGroup(source.key),
		resolveTarget,
		onDrop,
	});
};
