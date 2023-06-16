import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import type {
	Context,
	Current,
	Group,
	GroupName,
	GroupPrefix,
	RouteName,
	RouteNamesOf,
	RouteOptions,
	TrimPrefix,
} from 'meteor/kadira:flow-router';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import type { ElementType, ReactNode } from 'react';
import React from 'react';

import { navigate } from '../providers/RouterProvider';
import MainLayout from '../views/root/MainLayout';
import { appLayout } from './appLayout';

let oldRoute: Current;

const registerLazyComponentRoute = <TGroupName extends GroupName, TRouteName extends RouteNamesOf<TGroupName>>(
	routeGroup: Group<TGroupName>,
	RouterComponent: ElementType<{
		children?: ReactNode;
	}>,
	path: TrimPrefix<IRouterPaths[TRouteName]['pattern'], GroupPrefix<TGroupName>>,
	{
		component: RouteComponent,
		props,
		ready = true,
		...rest
	}: RouteOptions<TRouteName> & {
		component: ElementType;
		props?: Record<string, unknown>;
		ready?: boolean;
	},
): [register: () => void, unregister: () => void] => {
	const enabled = new ReactiveVar(ready ? true : undefined);
	let computation: Tracker.Computation | undefined;

	const handleEnter = (_context: Context, _redirect: (pathDef: string) => void, stop: () => void): void => {
		const _enabled = Tracker.nonreactive(() => enabled.get());
		if (_enabled === false) {
			stop();
			return;
		}

		computation = Tracker.autorun(() => {
			const _enabled = enabled.get();

			if (_enabled === false) {
				navigate('/');
			}
		});
	};

	const handleExit = (context: Context): void => {
		computation?.stop();

		if (!context.oldRoute) {
			return;
		}

		if (context.route.group?.name === context.oldRoute?.group?.name) {
			return;
		}

		oldRoute?.route?.name &&
			navigate({
				pattern: oldRoute.route.name,
				params: oldRoute.params,
				search: oldRoute.queryParams,
			});
	};

	routeGroup.route(path, {
		...rest,
		triggersEnter: [handleEnter, ...(rest.triggersEnter ?? [])],
		triggersExit: [handleExit, ...(rest.triggersExit ?? [])],
		action() {
			appLayout.render(
				<MainLayout>
					<RouterComponent>
						<RouteComponent {...props} />
					</RouterComponent>
				</MainLayout>,
			);
		},
	});

	return [(): void => enabled.set(true), (): void => enabled.set(false)];
};

export const createRouteGroup = <TGroupName extends GroupName>(
	name: TGroupName,
	prefix: GroupPrefix<TGroupName>,
	RouterComponent: ElementType<{
		children?: ReactNode;
	}>,
): {
	(path: '/' | '', options: RouteOptions<`${TGroupName}-index`>): [register: () => void, unregister: () => void];
	(
		path: '/' | '',
		options: RouteOptions<`${TGroupName}-index`> & {
			component: ElementType;
			props?: Record<string, unknown>;
			ready?: boolean;
		},
	): [register: () => void, unregister: () => void];
	<TRouteName extends RouteNamesOf<TGroupName>>(
		path: TrimPrefix<IRouterPaths[TRouteName]['pattern'], GroupPrefix<TGroupName>>,
		options: RouteOptions<TRouteName> & {
			component: ElementType;
			props?: Record<string, unknown>;
			ready?: boolean;
		},
	): [register: () => void, unregister: () => void];
	<TRouteName extends RouteNamesOf<TGroupName>>(
		path: TrimPrefix<IRouterPaths[TRouteName]['pattern'], GroupPrefix<TGroupName>>,
		options: RouteOptions<TRouteName>,
	): void;
} => {
	const routeGroup = FlowRouter.group({
		name,
		prefix,
	});

	function registerRoute(path: '/' | '', options: RouteOptions<`${TGroupName}-index`>): [register: () => void, unregister: () => void];
	function registerRoute<TRouteName extends RouteNamesOf<TGroupName>>(
		path: TrimPrefix<IRouterPaths[TRouteName]['pattern'], GroupPrefix<TGroupName>>,
		options: RouteOptions<TRouteName> & {
			component: ElementType;
			props?: Record<string, unknown>;
			ready?: boolean;
		},
	): [register: () => void, unregister: () => void];
	function registerRoute<TRouteName extends RouteNamesOf<TGroupName>>(
		path: TrimPrefix<IRouterPaths[TRouteName]['pattern'], GroupPrefix<TGroupName>>,
		options: RouteOptions<TRouteName>,
	): void;
	function registerRoute<TRouteName extends RouteNamesOf<TGroupName>>(
		path: TrimPrefix<IRouterPaths[TRouteName]['pattern'], GroupPrefix<TGroupName>>,
		options:
			| RouteOptions<TRouteName>
			| (RouteOptions<TRouteName> & {
					component: ElementType;
					props?: Record<string, unknown>;
					ready?: boolean;
			  }),
	): [register: () => void, unregister: () => void] | void {
		if ('component' in options) {
			return registerLazyComponentRoute(routeGroup, RouterComponent, path, options);
		}

		routeGroup.route(path, options);
	}

	registerRoute('/', {
		name: `${name}-index`,
		action() {
			appLayout.render(
				<MainLayout>
					<RouterComponent />
				</MainLayout>,
			);
		},
	});

	return registerRoute;
};

Tracker.autorun(
	(() => {
		let oldName: RouteName | undefined;
		return () => {
			const name = FlowRouter.getRouteName();
			if (oldName !== name) {
				oldRoute = FlowRouter.current();
			}
		};
	})(),
);
