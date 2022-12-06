import type { Group, RouteOptions } from 'meteor/kadira:flow-router';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import type { ElementType, ReactNode } from 'react';
import React from 'react';

import MainLayout from '../views/root/MainLayout';
import { appLayout } from './appLayout';

const registerLazyComponentRoute = (
	routeGroup: Group,
	RouterComponent: ElementType<{
		children?: ReactNode;
	}>,
	path: string,
	{
		component: RouteComponent,
		props,
		ready = true,
		...rest
	}: RouteOptions & {
		component: ElementType;
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

export const createRouteGroup = (
	name: string,
	prefix: string,
	RouterComponent: ElementType<{
		children?: ReactNode;
	}>,
): {
	(
		path: string,
		options: RouteOptions & {
			component: ElementType;
			props?: Record<string, unknown>;
			ready?: boolean;
		},
	): [register: () => void, unregister: () => void];
	(path: string, options: RouteOptions): void;
} => {
	const routeGroup = FlowRouter.group({
		name,
		prefix,
	});

	function registerRoute(
		path: string,
		options: RouteOptions & {
			component: ElementType;
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
