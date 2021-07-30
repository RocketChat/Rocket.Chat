import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription } from 'use-subscription';

type RouteName = string;

type RouteParameters = Record<string, string>;

type QueryStringParameters = Record<string, string>;

type RouteGroupName = string;

export type RouterContextValue = {
	queryRoutePath: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => Subscription<string | undefined>;
	queryRouteUrl: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => Subscription<string | undefined>;
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
	queryRouteParameter: (name: string) => Subscription<string | undefined>;
	queryQueryStringParameter: (name: string) => Subscription<string | undefined>;
	queryCurrentRoute: () => Subscription<
		[RouteName?, RouteParameters?, QueryStringParameters?, RouteGroupName?]
	>;
};

export const RouterContext = createContext<RouterContextValue>({
	queryRoutePath: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: () => (): void => undefined,
	}),
	queryRouteUrl: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: () => (): void => undefined,
	}),
	pushRoute: () => undefined,
	replaceRoute: () => undefined,
	queryRouteParameter: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: () => (): void => undefined,
	}),
	queryQueryStringParameter: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: () => (): void => undefined,
	}),
	queryCurrentRoute: () => ({
		getCurrentValue: (): [undefined, {}, {}, undefined] => [undefined, {}, {}, undefined],
		subscribe: () => (): void => undefined,
	}),
});

type Route = {
	getPath: (
		parameters?: RouteParameters,
		queryStringParameters?: QueryStringParameters,
	) => string | undefined;
	getUrl: (
		parameters?: RouteParameters,
		queryStringParameters?: QueryStringParameters,
	) => string | undefined;
	push: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => void;
	replace: (parameters?: RouteParameters, queryStringParameters?: QueryStringParameters) => void;
};

export const useRoute = (name: string): Route => {
	const { queryRoutePath, queryRouteUrl, pushRoute, replaceRoute } = useContext(RouterContext);

	return useMemo<Route>(
		() => ({
			getPath: (parameters, queryStringParameters): string | undefined =>
				queryRoutePath(name, parameters, queryStringParameters).getCurrentValue(),
			getUrl: (parameters, queryStringParameters): ReturnType<Route['getUrl']> =>
				queryRouteUrl(name, parameters, queryStringParameters).getCurrentValue(),
			push: (parameters, queryStringParameters): ReturnType<Route['push']> =>
				pushRoute(name, parameters, queryStringParameters),
			replace: (parameters, queryStringParameters): ReturnType<Route['replace']> =>
				replaceRoute(name, parameters, queryStringParameters),
		}),
		[queryRoutePath, queryRouteUrl, name, pushRoute, replaceRoute],
	);
};

export const useRoutePath = (
	name: string,
	parameters?: RouteParameters,
	queryStringParameters?: QueryStringParameters,
): string | undefined => {
	const { queryRoutePath } = useContext(RouterContext);

	return useSubscription(
		useMemo(
			() => queryRoutePath(name, parameters, queryStringParameters),
			[queryRoutePath, name, parameters, queryStringParameters],
		),
	);
};

export const useRouteUrl = (
	name: string,
	parameters?: RouteParameters,
	queryStringParameters?: QueryStringParameters,
): string | undefined => {
	const { queryRouteUrl } = useContext(RouterContext);

	return useSubscription(
		useMemo(
			() => queryRouteUrl(name, parameters, queryStringParameters),
			[queryRouteUrl, name, parameters, queryStringParameters],
		),
	);
};

export const useRouteParameter = (name: string): string | undefined => {
	const { queryRouteParameter } = useContext(RouterContext);

	return useSubscription(useMemo(() => queryRouteParameter(name), [queryRouteParameter, name]));
};

export const useQueryStringParameter = (name: string): string | undefined => {
	const { queryQueryStringParameter } = useContext(RouterContext);

	return useSubscription(
		useMemo(() => queryQueryStringParameter(name), [queryQueryStringParameter, name]),
	);
};

export const useCurrentRoute = (): [
	RouteName?,
	RouteParameters?,
	QueryStringParameters?,
	RouteGroupName?,
] => {
	const { queryCurrentRoute } = useContext(RouterContext);

	return useSubscription(useMemo(() => queryCurrentRoute(), [queryCurrentRoute]));
};
