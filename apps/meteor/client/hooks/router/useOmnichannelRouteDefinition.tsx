import type { IRouterPaths } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

import type { RouteNamesOf, TrimPrefix } from '../../lib/createRouteGroup';
import { registerOmnichannelRoute } from '../../views/omnichannel/routes';
import { registerOmnichannelSidebarItem, unregisterOmnichannelSidebarItem } from '../../views/omnichannel/sidebarItems';

type UseOmnichannelRouteDefinitionOptions<TRouteName extends RouteNamesOf<'omnichannel'>> = {
	enabled?: boolean;
	id: TRouteName;
	path: IRouterPaths[TRouteName]['pattern'];
	sidebar: {
		id: string;
		href: IRouterPaths[TRouteName]['pathname'];
	};
	element: ReactNode;
};

export const useOmnichannelRouteDefinition = <TRouteName extends RouteNamesOf<'omnichannel'>>({
	enabled = true,
	...options
}: UseOmnichannelRouteDefinitionOptions<TRouteName>) => {
	const optionsRef = useRef(options);
	optionsRef.current = options;

	const componentRef = useRef(() => <>{optionsRef.current.element}</>);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const { id, path, sidebar } = optionsRef.current;
		const subpath = path.slice('/omnichannel'.length) as TrimPrefix<IRouterPaths[TRouteName]['pattern'], '/omnichannel'>;

		registerOmnichannelSidebarItem({
			i18nLabel: sidebar.id,
			href: sidebar.href,
		});

		const [, unregisterOmnichannelRoute] = registerOmnichannelRoute(subpath, {
			name: id,
			component: componentRef.current,
		});

		return () => {
			unregisterOmnichannelSidebarItem(sidebar.id);
			unregisterOmnichannelRoute();
		};
	}, [enabled]);
};
