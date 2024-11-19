import type { App } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { handleAPIError } from '../helpers/handleAPIError';

export const useUninstallAppMutation = (app: App) => {
	const dispatchToastMessage = useToastMessageDispatch();

	const uninstallApp = useEndpoint('DELETE', '/apps/:id', { id: app.id });

	return useMutation({
		mutationFn: async () => {
			const { success } = await uninstallApp();
			return success;
		},
		onSuccess: (success) => {
			if (success) {
				dispatchToastMessage({ type: 'success', message: `${app.name} uninstalled` }); // TODO: i18n
			}
		},
		onError: (error) => {
			handleAPIError(error);
		},
	});
};
