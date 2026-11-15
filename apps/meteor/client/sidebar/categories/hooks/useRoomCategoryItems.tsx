import { Icon } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCategoryModals } from './useCategoryModals';
import { useMoveRoomCategory } from './useMoveRoomCategory';
import type { MovableRoom } from './useUserSidebarCategories';
import { FAVORITES_TARGET, useUserSidebarCategories } from './useUserSidebarCategories';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';

export const useRoomCategoryItems = (room: MovableRoom) => {
	const { t } = useTranslation();
	const { customCategories } = useUserSidebarCategories();
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const moveRoomCategory = useMoveRoomCategory();
	const { openCreate } = useCategoryModals();
	const isFavoritesEnabled = useSetting('Favorite_Rooms', true);

	return useMemo(() => {
		const current = !room.isFavorite && room.categoryId ? customCategories.find((c) => c._id === room.categoryId) : undefined;
		const selected = <Icon name='check' size='x16' />;

		const moveToItems = [
			...(isFavoritesEnabled
				? [
						{
							id: 'favorites',
							icon: 'star' as const,
							content: t('Favorites'),
							onClick: async () => moveRoomCategory.mutateAsync({ room, target: FAVORITES_TARGET }),
							addon: room.isFavorite ? selected : undefined,
						},
					]
				: []),
			...customCategories.map((category) => ({
				id: category._id,
				icon: 'folder' as const,
				content: category.name,
				onClick: async () => moveRoomCategory.mutateAsync({ room, target: category._id }),
				addon: current?._id === category._id ? selected : undefined,
			})),
			...(isEnterprise ? [{ id: 'newCategory', icon: 'plus' as const, content: t('New_category'), onClick: () => openCreate(room) }] : []),
		];

		const currentName = current?.name ?? (room.isFavorite ? t('Favorites') : undefined);
		const removeItem = currentName
			? {
					id: 'removeFromCategory',
					icon: 'cross' as const,
					content: t('Remove_from__categoryName__', { categoryName: currentName }),
					onClick: async () => moveRoomCategory.mutateAsync({ room }),
				}
			: undefined;

		return { moveToItems, removeItem };
	}, [room, customCategories, isFavoritesEnabled, t, isEnterprise, moveRoomCategory, openCreate]);
};
