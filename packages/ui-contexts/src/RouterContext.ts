import { createContext } from 'react';

export type RouteName = string;

export type RouteParameters = Record<string, string>;

export type QueryStringParameters = Record<string, string>;

export type RouteGroupName = string;

export type RouterContextValue = {
	queryRoutePath: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string | undefined];
	queryRouteUrl: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string | undefined];
	pushRoute: (name: RouteName, parameters: RouteParameters | undefined, queryStringParameters: QueryStringParameters | undefined) => void;
	replaceRoute: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => void;
	queryRouteParameter: (name: string) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string | undefined];
	queryQueryStringParameter: (
		name: string,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string | undefined];
	queryCurrentRoute: () => [
		subscribe: (onStoreChange: () => void) => () => void,
		getSnapshot: () => [RouteName?, RouteParameters?, QueryStringParameters?, RouteGroupName?],
	];
};

export const RouterContext = createContext<RouterContextValue>({
	queryRoutePath: () => [() => (): void => undefined, (): undefined => undefined],
	queryRouteUrl: () => [() => (): void => undefined, (): undefined => undefined],
	pushRoute: () => undefined,
	replaceRoute: () => undefined,
	queryRouteParameter: () => [() => (): void => undefined, (): undefined => undefined],
	queryQueryStringParameter: () => [() => (): void => undefined, (): undefined => undefined],
	queryCurrentRoute: () => [
		() => (): void => undefined,
		(): [undefined, RouteParameters, QueryStringParameters, undefined] => [undefined, {}, {}, undefined],
	],
});
