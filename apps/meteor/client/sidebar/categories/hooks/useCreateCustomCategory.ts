import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { useToastMessageDispatch, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useSetCategory } from './useSetCategory';
import type { MovableRoom } from '../../hooks/useCustomCategories';

export const useCreateCustomCategory = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];

	const setCategory = useSetCategory();
	const persistMutation = usePersistCategoriesMutation();

	const createCategory = useCallback(
		async (name: string, roomIds: string[] = []) => {
			const category: ISidebarCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: false,
			};
			await persistMutation.mutateAsync([category, ...allEntries]);
			if (roomIds.length > 0) {
				await setCategory(roomIds, category._id);
			}
			return category;
		},
		[allEntries, persistMutation, setCategory],
	);

	const createCategoryAndMoveRoom = useCallback(
		async (name: string, room: MovableRoom, extraRoomIds: string[] = []) => {
			const category: ISidebarCategory = {
				_id: Random.id(),
				name: name.trim(),
				showUnreads: false,
			};
			await persistMutation.mutateAsync([category, ...allEntries]);
			await setCategory([room.rid, ...extraRoomIds], category._id);
			dispatchToastMessage({
				type: 'success',
				message: t('__roomName__moved_to__categoryName__', { roomName: room.name, categoryName: category.name }),
			});
		},
		[persistMutation, allEntries, setCategory, dispatchToastMessage, t],
	);

	return { createCategory, createCategoryAndMoveRoom };
};
