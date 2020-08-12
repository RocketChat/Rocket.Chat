import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Unsubscribe, Subscription } from 'use-subscription';

type RouteName = string;

type RouteParameters = Record<string, string>;

type QueryStringParameters = Record<string, string>;

export type RouterContextValue = {
	getRoutePath: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => string | undefined;
	subscribeToRoutePath: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
		callback: () => void,
	) => Unsubscribe;
	getRouteUrl: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => string | undefined;
	subscribeToRouteUrl: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
		callback: () => void,
	) => Unsubscribe;
	pushRoute: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => void;
	replaceRoute: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => void;
	getRouteParameter: (
		name: string
	) => string | undefined;
	subscribeToRouteParameter: (
		name: string,
		callback: () => void
	) => Unsubscribe;
	getQueryStringParameter: (
		name: string
	) => string | undefined;
	subscribeToQueryStringParameter: (
		name: string,
		callback: () => void
	) => Unsubscribe;
	getCurrentRoute: () => [
		RouteName?,
		RouteParameters?,
		QueryStringParameters?,
	];
	subscribeToCurrentRoute: (
		callback: () => void
	) => Unsubscribe;
};

export const RouterContext = createContext<RouterContextValue>({
	getRoutePath: () => undefined,
	subscribeToRoutePath: () => (): void => undefined,
	getRouteUrl: () => undefined,
	subscribeToRouteUrl: () => (): void => undefined,
	pushRoute: () => undefined,
	replaceRoute: () => undefined,
	getRouteParameter: () => undefined,
	subscribeToRouteParameter: () => (): void => undefined,
	getQueryStringParameter: () => undefined,
	subscribeToQueryStringParameter: () => (): void => undefined,
	getCurrentRoute: () => [],
	subscribeToCurrentRoute: () => (): void => undefined,
});

type Route = {
	getPath: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => string | undefined;
	getUrl: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => string | undefined;
	push: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => void;
	replace: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => void;
}

export const useRoute = (name: string): Route => {
	const { getRoutePath, getRouteUrl, pushRoute, replaceRoute } = useContext(RouterContext);

	return useMemo<Route>(() => ({
		getPath: (parameters, queryStringParameters): ReturnType<Route['getPath']> =>
			getRoutePath(name, parameters, queryStringParameters),
		getUrl: (parameters, queryStringParameters): ReturnType<Route['getUrl']> =>
			getRouteUrl(name, parameters, queryStringParameters),
		push: (parameters, queryStringParameters): ReturnType<Route['push']> =>
			pushRoute(name, parameters, queryStringParameters),
		replace: (parameters, queryStringParameters): ReturnType<Route['replace']> =>
			replaceRoute(name, parameters, queryStringParameters),
	}), [getRoutePath, getRouteUrl, name, pushRoute, replaceRoute]);
};

export const useRoutePath = (
	name: string,
	parameters?: RouteParameters,
	queryStringParameters?: QueryStringParameters,
): string | undefined => {
	const { getRoutePath, subscribeToRoutePath } = useContext(RouterContext);

	const subscription = useMemo<Subscription<string | undefined>>(() => ({
		getCurrentValue: (): string | undefined =>
			getRoutePath(name, parameters, queryStringParameters),
		subscribe: (callback): Unsubscribe =>
			subscribeToRoutePath(name, parameters, queryStringParameters, callback),
	}), [name, parameters, queryStringParameters, getRoutePath, subscribeToRoutePath]);

	return useSubscription(subscription);
};

export const useRouteUrl = (
	name: string,
	parameters?: RouteParameters,
	queryStringParameters?: QueryStringParameters,
): string | undefined => {
	const { getRouteUrl, subscribeToRouteUrl } = useContext(RouterContext);

	const subscription = useMemo<Subscription<string | undefined>>(() => ({
		getCurrentValue: (): string | undefined =>
			getRouteUrl(name, parameters, queryStringParameters),
		subscribe: (callback): Unsubscribe =>
			subscribeToRouteUrl(name, parameters, queryStringParameters, callback),
	}), [name, parameters, queryStringParameters, getRouteUrl, subscribeToRouteUrl]);

	return useSubscription(subscription);
};

export const useRouteParameter = (name: string): string | undefined => {
	const { getRouteParameter, subscribeToRouteParameter } = useContext(RouterContext);

	const subscription = useMemo<Subscription<string | undefined>>(() => ({
		getCurrentValue: (): string | undefined =>
			getRouteParameter(name),
		subscribe: (callback): Unsubscribe =>
			subscribeToRouteParameter(name, callback),
	}), [name, getRouteParameter, subscribeToRouteParameter]);

	return useSubscription(subscription);
};

export const useQueryStringParameter = (name: string): string | undefined => {
	const { getQueryStringParameter, subscribeToQueryStringParameter } = useContext(RouterContext);

	const subscription = useMemo<Subscription<string | undefined>>(() => ({
		getCurrentValue: (): string | undefined =>
			getQueryStringParameter(name),
		subscribe: (callback): Unsubscribe =>
			subscribeToQueryStringParameter(name, callback),
	}), [name, getQueryStringParameter, subscribeToQueryStringParameter]);

	return useSubscription(subscription);
};

export const useCurrentRoute = (): [RouteName?, RouteParameters?, QueryStringParameters?] => {
	const { getCurrentRoute, subscribeToCurrentRoute } = useContext(RouterContext);

	const subscription = useMemo<Subscription<[RouteName?, RouteParameters?, QueryStringParameters?]>>(() => ({
		getCurrentValue: (): [RouteName?, RouteParameters?, QueryStringParameters?] =>
			getCurrentRoute(),
		subscribe: (callback): Unsubscribe =>
			subscribeToCurrentRoute(callback),
	}), [getCurrentRoute, subscribeToCurrentRoute]);

	return useSubscription(subscription);
};
