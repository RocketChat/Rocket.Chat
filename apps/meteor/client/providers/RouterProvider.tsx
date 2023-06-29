import type {
	RouterContextValue,
	RouteName,
	LocationPathname,
	RouteParameters,
	SearchParameters,
	To,
	RouterPathPattern,
} from '@rocket.chat/ui-contexts';
import { RouterContext } from '@rocket.chat/ui-contexts';
import type { LocationSearch } from '@rocket.chat/ui-contexts/src/RouterContext';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import type { FC, ReactNode } from 'react';
import React from 'react';

import { appLayout } from '../lib/appLayout';
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

const getLocationPathname = () => FlowRouter.current().path as LocationPathname;

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

type RouteObject = {
	path: RouterPathPattern;
	id: RouteName;
	element: ReactNode;
};

interface IRouter extends RouterContextValue {
	defineRoute(route: RouteObject): () => void;
	getRoutes(): RouteObject[];
	subscribeToRoutesChange(onRoutesChange: () => void): () => void;
}

const routes: RouteObject[] = [];
const routesSubscribers = new Set<() => void>();

const updateFlowRouter = () => {
	if (FlowRouter._initialized) {
		FlowRouter._updateCallbacks();
		FlowRouter.reload();
	}
};

const defineRoute = (route: RouteObject) => {
	const flowRoute = FlowRouter.route(route.path as RouterPathPattern, {
		name: route.id as RouteName,
		action: () => appLayout.renderStandalone(<>{route.element}</>),
	});

	updateFlowRouter();

	routes.push(route);
	const index = routes.length - 1;

	routesSubscribers.forEach((onRoutesChange) => onRoutesChange());

	return () => {
		FlowRouter._routes = FlowRouter._routes.filter((r) => r !== flowRoute);
		if (flowRoute.name) {
			delete FlowRouter._routesMap[flowRoute.name];
		}

		updateFlowRouter();

		if (index !== -1) {
			routes.splice(index, 1);
		}

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

export const router: IRouter = {
	subscribeToRouteChange,
	getLocationPathname,
	getLocationSearch,
	getRouteParameters,
	getSearchParameters,
	getRouteName,
	buildRoutePath,
	navigate,
	defineRoute,
	getRoutes,
	subscribeToRoutesChange,
};

const RouterProvider: FC = ({ children }) => <RouterContext.Provider children={children} value={router} />;

export default RouterProvider;
