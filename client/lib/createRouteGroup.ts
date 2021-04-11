import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import type { ComponentType } from 'react';

import * as AppLayout from './appLayout';
import { createTemplateForComponent } from './portals/createTemplateForComponent';

type RouteRegister = {
	(
		path: string,
		params: Parameters<typeof FlowRouter.route>[1] &
			(
				| {}
				| {
						lazyRouteComponent: () => Promise<ComponentType>;
						props: Record<string, unknown>;
				  }
			),
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

	const registerRoute: RouteRegister = (path, options) => {
		if ('lazyRouteComponent' in options) {
			const { lazyRouteComponent, props, ...rest } = options;
			routeGroup.route(path, {
				...rest,
				action(params, queryParams) {
					const center = createTemplateForComponent(
						Tracker.nonreactive(() => FlowRouter.getRouteName()),
						importRouter,
						{
							attachment: 'at-parent',
							props: () => ({ lazyRouteComponent, ...rest, params, queryParams, ...props }),
						},
					);
					AppLayout.render('main', { center });
				},
			});
			return;
		}

		routeGroup.route(path, options);
	};

	registerRoute('/', {
		name: `${name}-index`,
		action() {
			const center = createTemplateForComponent(`${name}-index`, importRouter, {
				attachment: 'at-parent',
			});
			AppLayout.render('main', { center });
		},
	});

	return registerRoute;
};
