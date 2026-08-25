import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useSetCategory } from './useSetCategory';
import type { MovableRoom } from '../../hooks/useCustomCategories';
import { FAVORITES_TARGET, useCustomCategories } from '../../hooks/useCustomCategories';

export const useMoveRoomCategory = () => {
	const { t } = useTranslation();
	const toggleFavoriteEndpoint = useEndpoint('POST', '/v1/rooms.favorite');
	const dispatchToastMessage = useToastMessageDispatch();

	const setCategory = useSetCategory();
	const customCategories = useCustomCategories();

	const moveRoom = useCallback(
		async (room: MovableRoom, target: string, { silent = false }: { silent?: boolean } = {}) => {
			if (target === FAVORITES_TARGET) {
				await toggleFavoriteEndpoint({ roomId: room.rid, favorite: true });
				if (!silent && room.name) {
					dispatchToastMessage({
						type: 'success',
						message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: t('Favorites') }),
					});
				}
				return;
			}

			const category = customCategories.find((current) => current._id === target);
			if (!category) {
				return;
			}

			await setCategory([room.rid], target);

			if (!silent && room.name) {
				dispatchToastMessage({
					type: 'success',
					message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
				});
			}
		},
		[customCategories, setCategory, toggleFavoriteEndpoint, dispatchToastMessage, t],
	);

	const removeRoom = useCallback(
		async (room: MovableRoom) => {
			if (room.isFavorite) {
				await toggleFavoriteEndpoint({ roomId: room.rid, favorite: false });
			} else {
				await setCategory([room.rid], null);
			}
			if (room.name) {
				dispatchToastMessage({
					type: 'success',
					message: t('__roomName__removed_from_category', { roomName: room.name }),
				});
			}
		},
		[setCategory, toggleFavoriteEndpoint, dispatchToastMessage, t],
	);

	return { moveRoom, removeRoom };
};
