import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { ComponentType, createElement, lazy, ReactNode } from 'react';

import { appLayout } from './appLayout';
import { createTemplateForComponent } from './portals/createTemplateForComponent';

type RouteRegister = {
	(
		path: string,
		params: Parameters<typeof FlowRouter.route>[1] &
			(
				| {}
				| {
						lazyRouteComponent: () => Promise<{ default: ComponentType }>;
						props: Record<string, unknown>;
				  }
			),
	): void;
};

export const createRouteGroup = (
	name: string,
	prefix: string,
	importRouter: () => Promise<{
		default: ComponentType<{
			renderRoute?: () => ReactNode;
		}>;
	}>,
): RouteRegister => {
	const routeGroup = FlowRouter.group({
		name,
		prefix,
	});

	const registerRoute: RouteRegister = (path, options) => {
		if ('lazyRouteComponent' in options) {
			const { lazyRouteComponent, props, ...rest } = options;

			const RouteComponent = lazy(lazyRouteComponent);
			const renderRoute = (): ReactNode => createElement(RouteComponent, props);

			routeGroup.route(path, {
				...rest,
				action() {
					const center = createTemplateForComponent(
						Tracker.nonreactive(() => FlowRouter.getRouteName()),
						importRouter,
						{
							attachment: 'at-parent',
							props: () => ({ renderRoute }),
						},
					);
					appLayout.render('main', { center });
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
			appLayout.render('main', { center });
		},
	});

	return registerRoute;
};
