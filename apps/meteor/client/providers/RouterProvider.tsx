import type { RoomType, RoomRouteData } from '@rocket.chat/core-typings';
import { RouterContext } from '@rocket.chat/ui-contexts';
import type {
	RouterContextValue,
	RouteName,
	LocationPathname,
	RouteParameters,
	SearchParameters,
	To,
	RouteObject,
	LocationSearch,
} from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Tracker } from 'meteor/tracker';
import type { ReactNode } from 'react';

import { appLayout } from '../lib/appLayout';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';
import { queueMicrotask } from '../lib/utils/queueMicrotask';

const subscribers = new Set<() => void>();

const listenToRouteChange = () => {
	FlowRouter.watchPathChange();
	subscribers.forEach((onRouteChange) => onRouteChange());
};

let computation: Tracker.Computation | undefined;

queueMicrotask(() => {
	computation = Tracker.autorun(listenToRouteChange);
});

const subscribeToRouteChange = (onRouteChange: () => void): (() => void) => {
	subscribers.add(onRouteChange);

	computation?.invalidate();

	return () => {
		subscribers.delete(onRouteChange);

		if (subscribers.size === 0) {
			queueMicrotask(() => computation?.stop());
		}
	};
};

const getLocationPathname = () => FlowRouter.current().path.replace(/\?.*/, '') as LocationPathname;

const getLocationSearch = () => location.search as LocationSearch;

const getRouteParameters = () => (FlowRouter.current().params ?? {}) as RouteParameters;

const getSearchParameters = () => (FlowRouter.current().queryParams ?? {}) as SearchParameters;

const getRouteName = () => FlowRouter.current().route?.name as RouteName | undefined;

const encodeSearchParameters = (searchParameters: SearchParameters) => {
	const search = new URLSearchParams();

	for (const [key, value] of Object.entries(searchParameters)) {
		search.append(key, value);
	}

	const searchString = search.toString();

	return searchString ? `?${searchString}` : '';
};

const buildRoutePath = (to: To): LocationPathname | `${LocationPathname}?${LocationSearch}` => {
	if (typeof to === 'string') {
		return to;
	}

	if ('pathname' in to) {
		const { pathname, search = {} } = to;
		return (pathname + encodeSearchParameters(search)) as LocationPathname | `${LocationPathname}?${LocationSearch}`;
	}

	if ('pattern' in to) {
		const { pattern, params = {}, search = {} } = to;
		return Tracker.nonreactive(() => FlowRouter.path(pattern, params, search)) as
			| LocationPathname
			| `${LocationPathname}?${LocationSearch}`;
	}

	if ('name' in to) {
		const { name, params = {}, search = {} } = to;
		return Tracker.nonreactive(() => FlowRouter.path(name, params, search)) as LocationPathname | `${LocationPathname}?${LocationSearch}`;
	}

	throw new Error('Invalid route');
};

const navigate = (
	toOrDelta: To | number,
	options?: {
		replace?: boolean;
	},
) => {
	if (typeof toOrDelta === 'number') {
		history.go(toOrDelta);
		return;
	}

	const path = buildRoutePath(toOrDelta);
	const state = { path };

	if (options?.replace) {
		history.replaceState(state, '', path);
	} else {
		history.pushState(state, '', path);
	}

	dispatchEvent(new PopStateEvent('popstate', { state }));
};

const routes: RouteObject[] = [];
const routesSubscribers = new Set<() => void>();

const updateFlowRouter = () => {
	if (FlowRouter._initialized) {
		FlowRouter._updateCallbacks();
		FlowRouter._page.dispatch(new FlowRouter._page.Context(FlowRouter._current.path));
		return;
	}

	FlowRouter.initialize({
		hashbang: false,
		page: {
			click: true,
		},
	});
};

const defineRoutes = (routes: RouteObject[]) => {
	const flowRoutes = routes.map((route) => {
		if (route.path === '*') {
			FlowRouter.notFound = {
				action: () => appLayout.render(<>{route.element}</>),
			};

			return FlowRouter.notFound;
		}

		return FlowRouter.route(route.path, {
			name: route.id,
			action: () => appLayout.render(<>{route.element}</>),
		});
	});

	routes.push(...routes);
	const index = routes.length - 1;

	updateFlowRouter();
	routesSubscribers.forEach((onRoutesChange) => onRoutesChange());

	return () => {
		flowRoutes.forEach((flowRoute) => {
			FlowRouter._routes = FlowRouter._routes.filter((r) => r !== flowRoute);
			if ('name' in flowRoute && flowRoute.name) {
				delete FlowRouter._routesMap[flowRoute.name];
			} else {
				FlowRouter.notFound = {
					action: () => appLayout.render(<></>),
				};
			}
		});

		if (index !== -1) {
			routes.splice(index, 1);
		}

		updateFlowRouter();
		routesSubscribers.forEach((onRoutesChange) => onRoutesChange());
	};
};

const getRoutes = () => routes;

const subscribeToRoutesChange = (onRoutesChange: () => void): (() => void) => {
	routesSubscribers.add(onRoutesChange);

	onRoutesChange();

	return () => {
		routesSubscribers.delete(onRoutesChange);
	};
};

/** @deprecated */
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
	getRoutes,
	subscribeToRoutesChange,
	getRoomRoute(roomType: RoomType, routeData: RoomRouteData) {
		return { path: roomCoordinator.getRouteLink(roomType, routeData) || '/' };
	},
};

type RouterProviderProps = {
	children?: ReactNode;
};

const RouterProvider = ({ children }: RouterProviderProps) => <RouterContext.Provider children={children} value={router} />;

export default RouterProvider;
