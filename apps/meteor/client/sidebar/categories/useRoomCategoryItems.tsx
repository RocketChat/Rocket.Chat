import { Icon } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategoryModals } from './useCategoryModals';
import type { MovableRoom } from '../hooks/useCustomCategories';
import { FAVORITES_TARGET, useCustomCategories } from '../hooks/useCustomCategories';

/**
 * Builds the "Move to" targets (Favorites, each custom category, New category) for a room.
 * Shared by the sidebar item context menu and the room-header grouping dropdown.
 */
export const useRoomCategoryItems = () => {
	const { t } = useTranslation();
	const { hasLicenseModule, categories, moveRoom, removeRoom } = useCustomCategories();
	const { openCreate } = useCategoryModals();
	const isFavoritesEnabled = useSetting('Favorite_Rooms', true);

	return useCallback(
		(room: MovableRoom) => {
			// Favorites and custom categories are mutually exclusive — guard against stale categoryId during DDP propagation.
			const current = !room.isFavorite && room.categoryId ? categories.find((c) => c._id === room.categoryId) : undefined;
			const selected = <Icon name='check' size='x16' />;

			const moveToItems = [
				...(isFavoritesEnabled
					? [
							{
								id: 'favorites',
								icon: 'star' as const,
								content: t('Favorites'),
								onClick: room.isFavorite ? () => void removeRoom(room) : () => void moveRoom(room, FAVORITES_TARGET),
								addon: room.isFavorite ? selected : undefined,
							},
						]
					: []),
				...categories.map((category) => ({
					id: category._id,
					icon: 'folder' as const,
					content: category.name,
					onClick: current?._id === category._id ? () => void removeRoom(room) : () => void moveRoom(room, category._id),
					addon: current?._id === category._id ? selected : undefined,
				})),
				...(hasLicenseModule
					? [{ id: 'newCategory', icon: 'plus' as const, content: t('New_category'), onClick: () => openCreate(room) }]
					: []),
			];

			const currentName = current?.name ?? (room.isFavorite ? t('Favorites') : undefined);
			const removeItem = currentName
				? {
						id: 'removeFromCategory',
						icon: 'cross' as const,
						content: t('Remove_from__categoryName__', { categoryName: currentName }),
						onClick: () => void removeRoom(room),
					}
				: undefined;

			return { moveToItems, removeItem, hasLicenseModule };
		},
		[isFavoritesEnabled, hasLicenseModule, t, categories, moveRoom, removeRoom, openCreate],
	);
};
