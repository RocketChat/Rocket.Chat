import { FlowRouter } from 'meteor/kadira:flow-router';
import type { ComponentType } from 'react';

import { renderRouteComponent } from '../reactAdapters';

type RouteRegister = {
	(
		path: string,
		params: {
			name: string;
			lazyRouteComponent: () => Promise<ComponentType>;
			props: Record<string, unknown>;
			action: (params?: Record<string, string>, queryParams?: Record<string, string>) => void;
		},
	): void;
};

export const createRouteGroup = (
	name: string,
	prefix: string,
	importRouter: () => Promise<{ default: ComponentType }>,
): RouteRegister => {
	const routeGroup = FlowRouter.group({
		name,
		prefix,
	});

	const registerRoute: RouteRegister = (
		path,
		{ lazyRouteComponent, props, action, ...options },
	) => {
		routeGroup.route(path, {
			...options,
			action: (params, queryParams) => {
				if (action) {
					action(params, queryParams);
					return;
				}

				renderRouteComponent(importRouter, {
					template: 'main',
					region: 'center',
					propsFn: () => ({ lazyRouteComponent, ...options, params, queryParams, ...props }),
				});
			},
		});
	};

	return registerRoute;
};
