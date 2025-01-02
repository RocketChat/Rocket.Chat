import type { App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { handleAPIError } from '../helpers/handleAPIError';

export const useSyncAppMutation = (app: App) => {
	const syncApp = useEndpoint('POST', '/apps/:id/sync', { id: app.id });

	return useMutation({
		mutationFn: async () => {
			await syncApp();
		},
		onError: (error) => {
			handleAPIError(error);
		},
	});
};
