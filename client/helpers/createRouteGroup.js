import { FlowRouter } from 'meteor/kadira:flow-router';

import { renderRouteComponent } from '../reactAdapters';

export const createRouteGroup = (name, prefix, importRouter) => {
	const routeGroup = FlowRouter.group({
		name,
		prefix,
	});

	const registerRoute = (path, { lazyRouteComponent, props, action, ...options } = {}) => {
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
