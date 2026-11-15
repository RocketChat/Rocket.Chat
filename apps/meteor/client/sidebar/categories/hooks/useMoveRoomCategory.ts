import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useSetCategory } from './useSetCategory';
import type { MovableRoom } from './useUserSidebarCategories';
import { FAVORITES_TARGET, useUserSidebarCategories } from './useUserSidebarCategories';

type MoveRoomInput = {
	room: MovableRoom;
	target?: string;
	silent?: boolean;
};

export const useMoveRoomCategory = () => {
	const { t } = useTranslation();
	const toggleFavoriteEndpoint = useEndpoint('POST', '/v1/rooms.favorite');
	const dispatchToastMessage = useToastMessageDispatch();
	const setCategory = useSetCategory();
	const { customCategories } = useUserSidebarCategories();

	return useMutation({
		mutationFn: async ({ room, target, silent = false }: MoveRoomInput) => {
			const isInTarget = target === FAVORITES_TARGET ? room.isFavorite : room.categoryId === target;
			const ignoreToast = silent || !room.name;

			if (!target || isInTarget) {
				if (room.isFavorite) {
					await toggleFavoriteEndpoint({ roomId: room.rid, favorite: false });
				} else {
					await setCategory([room.rid], null);
				}
				return { message: ignoreToast ? null : t('__roomName__removed_from_category', { roomName: room.name }) };
			}

			if (target === FAVORITES_TARGET) {
				await toggleFavoriteEndpoint({ roomId: room.rid, favorite: true });
				return {
					message: ignoreToast ? null : t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: t('Favorites') }),
				};
			}

			const category = customCategories.find((category) => category._id === target);
			if (!category) {
				return null;
			}

			await setCategory([room.rid], target);
			return {
				message: ignoreToast ? null : t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
			};
		},
		onSuccess: (result) => {
			if (result?.message) {
				dispatchToastMessage({ type: 'success', message: result.message });
			}
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
