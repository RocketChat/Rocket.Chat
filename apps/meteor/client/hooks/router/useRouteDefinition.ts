import type { RouteObject } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

export type UseRouteDefinitionOptions = {
	enabled?: boolean;
} & RouteObject;

export const useRouteDefinition = ({ enabled = true, ...route }: UseRouteDefinitionOptions) => {
	const router = useRouter();

	const routeRef = useRef(route);
	routeRef.current = route;

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const route = routeRef.current;
		return router.defineRoutes([route]);
	}, [enabled, router]);
};
