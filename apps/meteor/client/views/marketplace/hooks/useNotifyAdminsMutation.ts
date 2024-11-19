import type { App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useNotifyAdminsMutation = () => {
	const notifyAdmins = useEndpoint('POST', '/apps/notify-admins');

	return useMutation({
		mutationFn: async ({ app, postMessage }: { app: App; postMessage: Record<string, unknown> }) => {
			const message =
				typeof postMessage === 'object' && postMessage !== null && 'message' in postMessage && typeof postMessage.message === 'string'
					? postMessage.message
					: '';

			await notifyAdmins({
				appId: app.id,
				appName: app.name,
				appVersion: app.marketplaceVersion,
				message,
			});
		},
	});
};
