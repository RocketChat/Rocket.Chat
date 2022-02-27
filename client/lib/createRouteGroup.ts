import { FlowRouter, Group, RouteOptions } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { ComponentType, createElement, lazy, ReactNode } from 'react';

import { appLayout } from './appLayout';
import { createTemplateForComponent } from './portals/createTemplateForComponent';

type RouteRegister = {
	(
		path: string,
		options: RouteOptions & {
			lazyRouteComponent: () => Promise<{ default: ComponentType }>;
			props?: Record<string, unknown>;
			ready?: boolean;
		},
	): [register: () => void, unregister: () => void];
	(path: string, options: RouteOptions): void;
};

const registerLazyComponentRoute = (
	routeGroup: Group,
	importRouter: () => Promise<{
		default: ComponentType<{
			renderRoute?: () => ReactNode;
		}>;
	}>,
	path: string,
	{
		lazyRouteComponent,
		props,
		ready = true,
		...rest
	}: RouteOptions & {
		lazyRouteComponent: () => Promise<{ default: ComponentType }>;
		props?: Record<string, unknown>;
		ready?: boolean;
	},
): [register: () => void, unregister: () => void] => {
	const enabled = new ReactiveVar(ready ? true : undefined);
	let computation: Tracker.Computation | undefined;

	const handleEnter = (_context: unknown, _redirect: (pathDef: string) => void, stop: () => void): void => {
		const _enabled = Tracker.nonreactive(() => enabled.get());
		if (_enabled === false) {
			stop();
			return;
		}

		computation = Tracker.autorun(() => {
			const _enabled = enabled.get();

			if (_enabled === false) {
				FlowRouter.go('/');
			}
		});
	};

	const handleExit = (): void => {
		computation?.stop();
	};

	const RouteComponent = lazy(lazyRouteComponent);
	const renderRoute = (): ReactNode => createElement(RouteComponent, props);

	routeGroup.route(path, {
		...rest,
		triggersEnter: [handleEnter, ...(rest.triggersEnter ?? [])],
		triggersExit: [handleExit, ...(rest.triggersExit ?? [])],
		action() {
			const center = createTemplateForComponent(
				Tracker.nonreactive(() => FlowRouter.getRouteName()),
				importRouter,
				{
					attachment: 'at-parent',
					props: () => ({ renderRoute }),
				},
			);
			appLayout.renderMainLayout({ center });
		},
	});

	return [(): void => enabled.set(true), (): void => enabled.set(false)];
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

	function registerRoute(
		path: string,
		options: RouteOptions & {
			lazyRouteComponent: () => Promise<{ default: ComponentType }>;
			props?: Record<string, unknown>;
			ready?: boolean;
		},
	): [register: () => void, unregister: () => void];
	function registerRoute(path: string, options: RouteOptions): void;
	function registerRoute(
		path: string,
		options:
			| RouteOptions
			| (RouteOptions & {
					lazyRouteComponent: () => Promise<{ default: ComponentType }>;
					props?: Record<string, unknown>;
					ready?: boolean;
			  }),
	): [register: () => void, unregister: () => void] | void {
		if ('lazyRouteComponent' in options) {
			return registerLazyComponentRoute(routeGroup, importRouter, path, options);
		}

		routeGroup.route(path, options);
	}

	registerRoute('/', {
		name: `${name}-index`,
		action() {
			const center = createTemplateForComponent(`${name}-index`, importRouter, {
				attachment: 'at-parent',
			});
			appLayout.renderMainLayout({ center });
		},
	});

	return registerRoute;
};
