import type { Keys as IconName } from '@rocket.chat/icons';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

import type { RouteNamesOf, TrimPrefix } from '../../lib/createRouteGroup';
import { registerAdminRoute } from '../../views/admin/routes';
import { registerAdminSidebarItem, unregisterAdminSidebarItem } from '../../views/admin/sidebarItems';

type UseAdminRouteDefinitionOptions<TRouteName extends RouteNamesOf<'admin'>> = {
	enabled?: boolean;
	id: TRouteName;
	path: IRouterPaths[TRouteName]['pattern'];
	sidebar: {
		id: string;
		href: IRouterPaths[TRouteName]['pathname'];
		icon?: IconName;
	};
	element: ReactNode;
};

export const useAdminRouteDefinition = <TRouteName extends RouteNamesOf<'admin'>>({
	enabled = true,
	...options
}: UseAdminRouteDefinitionOptions<TRouteName>) => {
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const componentRef = useRef(() => <>{optionsRef.current.element}</>);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const { id, path, sidebar } = optionsRef.current;
		const subpath = path.slice('/admin'.length) as TrimPrefix<IRouterPaths[TRouteName]['pattern'], '/admin'>;

		registerAdminSidebarItem({
			i18nLabel: sidebar.id,
			href: sidebar.href,
			icon: sidebar.icon,
		});

		const [, unregisterAdminRoute] = registerAdminRoute(subpath, {
			name: id,
			component: componentRef.current,
		});

		return () => {
			unregisterAdminSidebarItem(sidebar.id);
			unregisterAdminRoute();
		};
	}, [enabled]);
};
