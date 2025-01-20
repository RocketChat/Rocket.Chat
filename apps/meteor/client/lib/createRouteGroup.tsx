import type { IRouterPaths, RouteName, RouterPathPattern } from '@rocket.chat/ui-contexts';
import { type ElementType, type ReactNode } from 'react';

import { appLayout } from './appLayout';
import { router } from '../providers/RouterProvider';
import MainLayout from '../views/root/MainLayout';

type GroupName = 'omnichannel' | 'marketplace' | 'account' | 'admin';

type GroupPrefix<TGroupName extends GroupName> = IRouterPaths[`${TGroupName}-index`]['pattern'];

type RouteNamesOf<TGroupName extends GroupName> = (
	| keyof {
			[TRouteName in RouteName as IRouterPaths[TRouteName]['pattern'] extends `${GroupPrefix<TGroupName>}/${string}`
				? TRouteName
				: never]: never;
	  }
	| `${GroupName}-index`
) &
	RouteName;

type TrimPrefix<T, P extends string> = T extends `${P}${infer U}` ? U : T;

export const createRouteGroup = <TGroupName extends GroupName>(
	name: TGroupName,
	prefix: NoInfer<GroupPrefix<TGroupName>>,
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
