import type { Keys as IconName } from '@rocket.chat/icons';
import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

import type { RouteNamesOf, TrimPrefix } from '../../lib/createRouteGroup';
import { registerAccountRoute } from '../../views/account/routes';
import { registerAccountSidebarItem, unregisterAccountSidebarItem } from '../../views/account/sidebarItems';

type UseAccountRouteDefinitionOptions<TRouteName extends RouteNamesOf<'account'>> = {
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

export const useAccountRouteDefinition = <TRouteName extends RouteNamesOf<'account'>>({
	enabled = true,
	...options
}: UseAccountRouteDefinitionOptions<TRouteName>) => {
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const componentRef = useRef(() => <>{optionsRef.current.element}</>);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const { id, path, sidebar } = optionsRef.current;
		const subpath = path.slice('/account'.length) as TrimPrefix<IRouterPaths[TRouteName]['pattern'], '/account'>;

		registerAccountSidebarItem({
			i18nLabel: sidebar.id,
			href: sidebar.href,
			icon: sidebar.icon,
		});

		const [, unregisterAccountRoute] = registerAccountRoute(subpath, {
			name: id,
			component: componentRef.current,
		});

		return () => {
			unregisterAccountSidebarItem(sidebar.id);
			unregisterAccountRoute();
		};
	}, [enabled]);
};
