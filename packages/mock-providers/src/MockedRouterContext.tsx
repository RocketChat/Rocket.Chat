import { RouterContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';

export const MockedRouterContext = ({ children, router }: { children: ReactNode; router?: Partial<ContextType<typeof RouterContext>> }) => {
	return (
		<RouterContext.Provider
			value={{
				subscribeToRouteChange: () => () => undefined,
				getLocationPathname: () => '/',
				getLocationSearch: () => '',
				getRouteParameters: () => ({}),
				getSearchParameters: () => ({}),
				getRouteName: () => undefined,
				getPreviousRouteName: () => undefined,
				buildRoutePath: () => '/',
				navigate: () => undefined,
				defineRoutes: () => () => undefined,
				getRoomRoute: () => ({ path: '/' }),
				...router,
			}}
		>
			{children}
		</RouterContext.Provider>
	);
};
