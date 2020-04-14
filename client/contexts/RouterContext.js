import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

export const RouterContext = createContext({
	getRoutePath: () => {},
	subscribeToRoutePath: () => {},
	pushRoute: () => {},
	replaceRoute: () => {},
	getRouteParameter: () => {},
	subscribeToRouteParameter: () => {},
	getQueryStringParameter: () => {},
	subscribeToQueryStringParameter: () => {},
});

export const useRoute = (pathDefinition) => {
	const { getRoutePath, pushRoute, replaceRoute } = useContext(RouterContext);

	return useMemo(() => ({
		getPath: (...args) => getRoutePath(pathDefinition, ...args),
		push: (...args) => pushRoute(pathDefinition, ...args),
		replace: (...args) => replaceRoute(pathDefinition, ...args),
	}), [getRoutePath, pushRoute, replaceRoute]);
};

export const useRoutePath = (pathDefinition, params, queryStringParams) => {
	const { getRoutePath, subscribeToRoutePath } = useContext(RouterContext);

	const subscription = useMemo(() => ({
		getCurrentValue: () => getRoutePath(pathDefinition, params, queryStringParams),
		subscribe: (callback) => subscribeToRoutePath(pathDefinition, params, queryStringParams, callback),
	}), [pathDefinition, params, queryStringParams, getRoutePath, subscribeToRoutePath]);

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
