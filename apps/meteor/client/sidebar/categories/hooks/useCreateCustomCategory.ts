import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { useToastMessageDispatch, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { MovableRoom } from './useCustomCategories';
import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useSetCategory } from './useSetCategory';

export const useCreateCustomCategory = ({ settleCallback }: { settleCallback?: () => void } = {}) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];

	const setCategory = useSetCategory();
	const persistMutation = usePersistCategoriesMutation();

	return useMutation({
		mutationFn: async ({ name, roomIds = [], movedRoom }: { name: string; roomIds?: string[]; movedRoom?: MovableRoom }) => {
			const category: ISidebarCategory = { _id: Random.id(), name: name.trim(), showUnreads: false };
			await persistMutation.mutateAsync([category, ...allEntries]);
			const allRoomIds = movedRoom ? [movedRoom.rid, ...roomIds.filter((id) => id !== movedRoom.rid)] : roomIds;
			if (allRoomIds.length > 0) {
				await setCategory(allRoomIds, category._id);
			}
			return { category, movedRoom };
		},
		onSuccess: ({ category, movedRoom }) => {
			if (movedRoom?.name) {
				dispatchToastMessage({
					type: 'success',
					message: t('__roomName__moved_to__categoryName__', { roomName: movedRoom.name, categoryName: category.name }),
				});
			} else {
				dispatchToastMessage({ type: 'success', message: t('Category_created') });
			}
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			settleCallback?.();
		},
	});
};
