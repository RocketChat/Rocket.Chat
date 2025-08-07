import type { RoomType, RoomRouteData } from '@rocket.chat/core-typings';
import { RouterContext } from '@rocket.chat/ui-contexts';
import type { RouterContextValue } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import { FlowRouter } from '../flowRouter';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

const {
	subscribeToRouteChange,
	getLocationPathname,
	getLocationSearch,
	getRouteParameters,
	getSearchParameters,
	getRouteName,
	buildRoutePath,
	navigate,
	defineRoutes,
} = FlowRouter;

/** @deprecated consume it from the `RouterContext` instead */
export const router: RouterContextValue = {
	subscribeToRouteChange,
	getLocationPathname,
	getLocationSearch,
	getRouteParameters,
	getSearchParameters,
	getRouteName,
	buildRoutePath,
	navigate,
	defineRoutes,
	getRoomRoute(roomType: RoomType, routeData: RoomRouteData) {
		return { path: roomCoordinator.getRouteLink(roomType, routeData) || '/' };
	},
};

type RouterProviderProps = {
	children?: ReactNode;
};

const RouterProvider = ({ children }: RouterProviderProps) => <RouterContext.Provider children={children} value={router} />;

export default RouterProvider;
