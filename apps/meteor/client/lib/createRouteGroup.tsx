import type { IRouterPaths, RouterPathPattern } from '@rocket.chat/ui-contexts';
import type { GroupName, GroupPrefix, RouteNamesOf, TrimPrefix } from 'meteor/kadira:flow-router';
import type { ElementType, ReactNode } from 'react';
import React from 'react';

import { router } from '../providers/RouterProvider';
import MainLayout from '../views/root/MainLayout';
import { appLayout } from './appLayout';

export const createRouteGroup = <TGroupName extends GroupName>(
	name: TGroupName,
	prefix: GroupPrefix<TGroupName>,
	RouterComponent: ElementType<{
		children?: ReactNode;
	}>,
) => {
	router.defineRoutes([
		{
			path: prefix,
			id: `${name}-index`,
			element: appLayout.wrap(
				<MainLayout>
					<RouterComponent />
				</MainLayout>,
			),
		},
	]);

	return <TRouteName extends RouteNamesOf<TGroupName>>(
		path: TrimPrefix<IRouterPaths[TRouteName]['pattern'], GroupPrefix<TGroupName>>,
		{
			name,
			component: RouteComponent,
			props,
			ready = true,
		}: {
			name: TRouteName;
			component: ElementType;
			props?: Record<string, unknown>;
			ready?: boolean;
		},
	): [register: () => void, unregister: () => void] => {
		let unregister: (() => void) | undefined;

		const register = () => {
			unregister = router.defineRoutes([
				{
					path: `${prefix}${path}` as RouterPathPattern,
					id: name,
					element: appLayout.wrap(
						<MainLayout>
							<RouterComponent>
								<RouteComponent {...props} />
							</RouterComponent>
						</MainLayout>,
					),
				},
			]);
		};

		if (ready) {
			register();
		}

		return [register, () => unregister?.()];
	};
};
