import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useSetCategory } from './useSetCategory';

export const useDeleteCategory = ({ categoryName, settleCallback }: { categoryName: string; settleCallback?: () => void }) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const allEntries = useUserPreference<ISidebarCategory[]>('sidebarCategories', []) ?? [];

	const setCategory = useSetCategory();
	const persistMutation = usePersistCategoriesMutation();

	return useMutation({
		mutationFn: async ({ categoryId, roomIds }: { categoryId: string; roomIds: string[] }) => {
			await persistMutation.mutateAsync(allEntries.filter((entry) => entry._id !== categoryId));
			if (roomIds.length > 0) {
				await setCategory(roomIds, null);
			}
		},
		onError: (error) => {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Category__name__deleted', { name: categoryName }) });
		},
		onSettled: () => {
			settleCallback?.();
		},
	});
};
