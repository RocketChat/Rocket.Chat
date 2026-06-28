import { Icon } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategoryModals } from './useCategoryModals';
import type { MovableRoom } from '../../hooks/useCustomCategories';
import { FAVORITES_TARGET, useCustomCategories } from '../../hooks/useCustomCategories';

/** A "Move to" target. `emoji` (a custom category's emoji name) renders in place of the folder icon. */
export type MoveToItem = GenericMenuItemProps & { emoji?: string };

/**
 * Builds the "Move to" targets (Favorites, each custom category, New category) and a "Create" item for a room.
 * Shared by the sidebar item context menu and the room-header grouping dropdown.
 */
export const useRoomCategoryItems = () => {
	const { t } = useTranslation();
	const { categories, moveRoom, removeRoom, getRoomCategory } = useCustomCategories();
	const { openCreate } = useCategoryModals();

	return useCallback(
		(room: MovableRoom): { moveToItems: MoveToItem[]; createItem: GenericMenuItemProps; removeItem?: GenericMenuItemProps } => {
			const current = getRoomCategory(room.rid);
			const selected = <Icon name='check' size='x16' />;

			const moveToItems: MoveToItem[] = [
				{
					id: 'favorites',
					icon: 'star',
					content: t('Favorites'),
					onClick: () => void moveRoom(room, FAVORITES_TARGET),
					status: room.isFavorite ? selected : undefined,
				},
				...categories.map(
					(category): MoveToItem => ({
						id: category._id,
						icon: 'folder',
						emoji: category.icon,
						content: category.name,
						onClick: () => void moveRoom(room, category._id),
						status: current?._id === category._id ? selected : undefined,
					}),
				),
				{ id: 'newCategory', icon: 'plus', content: t('New_category'), onClick: () => openCreate(room) },
			];

			const createItem: GenericMenuItemProps = { id: 'createCategory', icon: 'plus', content: t('Create'), onClick: () => openCreate() };

			// Shown only when the room currently belongs to a custom category or Favorites — removes it back to its system group.
			const currentName = current?.name ?? (room.isFavorite ? t('Favorites') : undefined);
			const removeItem: GenericMenuItemProps | undefined = currentName
				? {
						id: 'removeFromCategory',
						content: t('Remove_from__categoryName__', { categoryName: currentName }),
						onClick: () => void removeRoom(room),
					}
				: undefined;

			return { moveToItems, createItem, removeItem };
		},
		[t, categories, moveRoom, removeRoom, getRoomCategory, openCreate],
	);
};
