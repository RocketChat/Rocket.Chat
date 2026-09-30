import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import { RouterContextProvider } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

export type MockedRouterContextProps = { children: ReactNode; router?: Partial<RouterContextValue> };

export const MockedRouterContext = ({ children, router }: MockedRouterContextProps) => {
	return (
		<RouterContextProvider
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
		</RouterContextProvider>
	);
};
