import { Icon } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategoryModals } from './useCategoryModals';
import type { MovableRoom } from '../hooks/useCustomCategories';
import { FAVORITES_TARGET, useCustomCategories } from '../hooks/useCustomCategories';

/** A "Move to" target. */
export type MoveToItem = GenericMenuItemProps;

/**
 * Builds the "Move to" targets (Favorites, each custom category, New category) for a room.
 * Shared by the sidebar item context menu and the room-header grouping dropdown.
 */
export const useRoomCategoryItems = () => {
	const { t } = useTranslation();
	const { isEnterprise, categories, moveRoom, removeRoom, getRoomCategory } = useCustomCategories();
	const { openCreate } = useCategoryModals();

	return useCallback(
		(room: MovableRoom): { moveToItems: MoveToItem[]; removeItem?: GenericMenuItemProps; isEnterprise: boolean } => {
			const current = getRoomCategory(room.rid);
			const selected = <Icon name='check' size='x16' />;

			const moveToItems: MoveToItem[] = [
				{
					id: 'favorites',
					icon: 'star',
					content: t('Favorites'),
					onClick: room.isFavorite ? () => void removeRoom(room) : () => void moveRoom(room, FAVORITES_TARGET),
					addon: room.isFavorite ? selected : undefined,
				},
				...categories.map(
					(category): MoveToItem => ({
						id: category._id,
						icon: 'folder',
						content: category.name,
						onClick: current?._id === category._id ? () => void removeRoom(room) : () => void moveRoom(room, category._id),
						addon: current?._id === category._id ? selected : undefined,
					}),
				),
				...(isEnterprise
					? [{ id: 'newCategory', icon: 'plus' as const, content: t('New_category'), onClick: () => openCreate(room) }]
					: []),
			];

			const currentName = current?.name ?? (room.isFavorite ? t('Favorites') : undefined);
			const removeItem: GenericMenuItemProps | undefined = currentName
				? {
						id: 'removeFromCategory',
						icon: 'cross',
						content: t('Remove_from__categoryName__', { categoryName: currentName }),
						onClick: () => void removeRoom(room),
					}
				: undefined;

			return { moveToItems, removeItem, isEnterprise };
		},
		[isEnterprise, t, categories, moveRoom, removeRoom, getRoomCategory, openCreate],
	);
};
