import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { useToastMessageDispatch, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useSetCategory } from './useSetCategory';
import { useUserSidebarCategories, type MovableRoom } from './useUserSidebarCategories';
import { withDynamicFirst } from '../../hooks/useCategoryList';

export const useCreateCustomCategory = ({ settleCallback }: { settleCallback?: () => void } = {}) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { rawCategories } = useUserSidebarCategories();
	const sidebarSectionsOrder: readonly string[] = useUserPreference<string[]>('sidebarSectionsOrder') ?? SIDEBAR_SYSTEM_GROUP_KEYS;

	const setCategory = useSetCategory();
	const { mutateAsync: persistCategories } = usePersistCategoriesMutation();

	return useMutation({
		mutationFn: async ({ name, roomIds = [], movedRoom }: { name: string; roomIds?: string[]; movedRoom?: MovableRoom }) => {
			const category: ISidebarCategory = { _id: Random.id(), name: name.trim(), showUnreads: false };
			const entryMap = new Map(rawCategories.map((e) => [e._id, e]));
			entryMap.set(category._id, category);
			const finalIds = withDynamicFirst([category._id, ...rawCategories.map((e) => e._id)], sidebarSectionsOrder);
			await persistCategories(finalIds.map((k) => entryMap.get(k) ?? { _id: k, name: k, default: true }));
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
