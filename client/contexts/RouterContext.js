import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

export const RouterContext = createContext({
	navigateTo: () => {},
	replaceWith: () => {},
	getRoutePath: () => null,
	getRouteParameter: () => {},
	subscribeToRouteParameter: () => {},
	getQueryStringParameter: () => {},
	subscribeToQueryStringParameter: () => {},
});

export const useRoute = (pathDefinition) => {
	const { navigateTo, replaceWith } = useContext(RouterContext);

	return useMemo(() => {
		const navigate = (...args) => navigateTo(pathDefinition, ...args);
		navigate.replacingState = (...args) => replaceWith(pathDefinition, ...args);
		return navigate;
	}, [navigateTo, replaceWith]);
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
