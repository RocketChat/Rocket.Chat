import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';
import { useSetCategory } from './useSetCategory';
import { useUserSidebarCategories } from './useUserSidebarCategories';

export const useDeleteCategory = ({ categoryName, settleCallback }: { categoryName: string; settleCallback?: () => void }) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { rawCategories } = useUserSidebarCategories();

	const setCategory = useSetCategory();
	const persistMutation = usePersistCategoriesMutation();

	return useMutation({
		mutationFn: async ({ categoryId, roomIds }: { categoryId: string; roomIds: string[] }) => {
			await persistMutation.mutateAsync(rawCategories.filter((entry) => entry._id !== categoryId));
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
