import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const usePersistCategoriesMutation = () => {
	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: (categories: ISidebarCategory[]) => saveUserPreferences({ data: { sidebarCategories: categories } }),
		// Every writer of the sidebar categories goes through here, so a rejected write is reported once, for all of them.
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
