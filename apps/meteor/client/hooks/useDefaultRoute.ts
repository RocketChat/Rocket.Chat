import type { useRoute } from '@rocket.chat/ui-contexts';

import { hasPermission } from '../../app/authorization/client';

export const useDefaultRoute = (
	routes: Record<string, ReturnType<typeof useRoute>>,
	permissions: string[],
	fallbackRoute: ReturnType<typeof useRoute>,
): ReturnType<typeof useRoute> => {
	const defaultRoute = permissions.find((permission) => hasPermission(permission));

	return defaultRoute ? routes[defaultRoute] : fallbackRoute;
};
