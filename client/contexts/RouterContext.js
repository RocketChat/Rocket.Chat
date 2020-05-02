import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

export const RouterContext = createContext({
	getRoutePath: () => {},
	subscribeToRoutePath: () => () => {},
	getRouteUrl: () => {},
	subscribeToRouteUrl: () => () => {},
	pushRoute: () => {},
	replaceRoute: () => {},
	getRouteParameter: () => {},
	subscribeToRouteParameter: () => () => {},
	getQueryStringParameter: () => {},
	subscribeToQueryStringParameter: () => () => {},
	getCurrentRoute: () => {},
	subscribeToCurrentRoute: () => () => {},
});

export const useRoute = (name) => {
	const { getRoutePath, getRouteUrl, pushRoute, replaceRoute } = useContext(RouterContext);

	return useMemo(() => ({
		getPath: (...args) => getRoutePath(name, ...args),
		getUrl: (...args) => getRouteUrl(name, ...args),
		push: (...args) => pushRoute(name, ...args),
		replace: (...args) => replaceRoute(name, ...args),
	}), [getRoutePath, pushRoute, replaceRoute]);
};

export const useRoutePath = (name, params, queryStringParams) => {
	const { getRoutePath, subscribeToRoutePath } = useContext(RouterContext);

	const subscription = useMemo(() => ({
		getCurrentValue: () => getRoutePath(name, params, queryStringParams),
		subscribe: (callback) => subscribeToRoutePath(name, params, queryStringParams, callback),
	}), [name, params, queryStringParams, getRoutePath, subscribeToRoutePath]);

	return useSubscription(subscription);
};

export const useRouteUrl = (name, params, queryStringParams) => {
	const { getRouteUrl, subscribeToRouteUrl } = useContext(RouterContext);

	const subscription = useMemo(() => ({
		getCurrentValue: () => getRouteUrl(name, params, queryStringParams),
		subscribe: (callback) => subscribeToRouteUrl(name, params, queryStringParams, callback),
	}), [name, params, queryStringParams, getRouteUrl, subscribeToRouteUrl]);

	return useSubscription(subscription);
};

export const useRouteParameter = (name) => {
	const { getRouteParameter, subscribeToRouteParameter } = useContext(RouterContext);

	const subscription = useMemo(() => ({
		getCurrentValue: () => getRouteParameter(name),
		subscribe: (callback) => subscribeToRouteParameter(name, callback),
	}), [name, getRouteParameter, subscribeToRouteParameter]);

	return useSubscription(subscription);
};

export const useQueryStringParameter = (name) => {
	const { getQueryStringParameter, subscribeToQueryStringParameter } = useContext(RouterContext);

	const subscription = useMemo(() => ({
		getCurrentValue: () => getQueryStringParameter(name),
		subscribe: (callback) => subscribeToQueryStringParameter(name, callback),
	}), [name, getQueryStringParameter, subscribeToQueryStringParameter]);

	return useSubscription(subscription);
};

export const useCurrentRoute = () => {
	const { getCurrentRoute, subscribeToCurrentRoute } = useContext(RouterContext);

	const subscription = useMemo(() => ({
		getCurrentValue: () => getCurrentRoute(),
		subscribe: (callback) => subscribeToCurrentRoute(callback),
	}), [getCurrentRoute, subscribeToCurrentRoute]);

	return useSubscription(subscription);
};
