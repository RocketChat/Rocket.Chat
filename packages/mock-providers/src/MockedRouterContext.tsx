import { RouterContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';

export type MockedRouterContextProps = { children: ReactNode; router?: Partial<ContextType<typeof RouterContext>> };

export const MockedRouterContext = ({ children, router }: MockedRouterContextProps) => {
	return (
		<RouterContext.Provider
			value={{
				subscribeToRouteChange: () => () => undefined,
				getLocationPathname: () => '/',
				getLocationSearch: () => '',
				getLocationHash: () => '',
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
