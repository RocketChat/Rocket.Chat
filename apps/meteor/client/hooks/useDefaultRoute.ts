import type { useRoute } from '@rocket.chat/ui-contexts';

import { hasPermission } from '../../app/authorization/client';

export const useDefaultRoute = (
	permissionRouteDictionary: Record<string, ReturnType<typeof useRoute>>,
	fallbackRoute: ReturnType<typeof useRoute>,
): ReturnType<typeof useRoute> => {
	const permissions = Object.keys(permissionRouteDictionary);
	const defaultRoute = permissions.find((permission) => hasPermission(permission));

	return defaultRoute ? permissionRouteDictionary[defaultRoute] : fallbackRoute;
};
