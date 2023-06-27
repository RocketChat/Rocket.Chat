import type { RouterContextValue, RouteName, LocationPathname, RouteParameters, SearchParameters, To } from '@rocket.chat/ui-contexts';
import { RouterContext } from '@rocket.chat/ui-contexts';
import type { LocationSearch } from '@rocket.chat/ui-contexts/src/RouterContext';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import type { FC } from 'react';
import React from 'react';

import { createSubscription } from '../lib/createSubscription';
import { queueMicrotask } from '../lib/utils/queueMicrotask';

const subscribers = new Set<() => void>();

const listenToRouteChange = (): void => {
	FlowRouter.watchPathChange();
	subscribers.forEach((onRouteChange) => onRouteChange());
};

let computation: Tracker.Computation | undefined;

queueMicrotask(() => {
	computation = Tracker.autorun(listenToRouteChange);
});

const subscribeToRouteChange = (onRouteChange: () => void): (() => void) => {
	subscribers.add(onRouteChange);

	onRouteChange();

	return () => {
		subscribers.delete(onRouteChange);

		if (subscribers.size === 0) {
			queueMicrotask(() => computation?.stop());
		}
	};
};

const getLocationPathname = () => FlowRouter.current().path as LocationPathname;

const getLocationSearch = () => location.search as LocationSearch;

const getRouteParameters = () => FlowRouter.current().params as RouteParameters;

const getSearchParameters = () => (FlowRouter.current().queryParams ?? {}) as SearchParameters;

const getRouteName = () => FlowRouter.current().route.name as RouteName | undefined;

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
		history.replaceState({ path }, '', path);
	} else {
		history.pushState({ path }, '', path);
	}

	dispatchEvent(new PopStateEvent('popstate', { state }));
};

const queryCurrentRoute = (): ReturnType<RouterContextValue['queryCurrentRoute']> =>
	createSubscription(() => {
		FlowRouter.watchPathChange();
		const { route, params, queryParams } = FlowRouter.current();
		return [route?.name, params, queryParams, route?.group?.name];
	});

export const router: RouterContextValue = {
	subscribeToRouteChange,
	getLocationPathname,
	getLocationSearch,
	getRouteParameters,
	getSearchParameters,
	getRouteName,
	buildRoutePath,
	navigate,
	queryCurrentRoute,
};

const RouterProvider: FC = ({ children }) => <RouterContext.Provider children={children} value={router} />;

export default RouterProvider;
