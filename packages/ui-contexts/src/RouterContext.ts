import { createContext } from 'react';

export interface IRouterPaths {
	index: {
		pattern: '/';
		pathname: '/';
	};
	home: {
		pattern: '/home';
		pathname: '/home';
	};
}

export type RouterPathName = keyof IRouterPaths;
export type RouterPathPattern = IRouterPaths[keyof IRouterPaths]['pattern'];
type Pathname = IRouterPaths[keyof IRouterPaths]['pathname'];

type To =
	| Pathname
	| {
			pattern: RouterPathPattern;
			params: Record<string, string>;
			search?: Record<string, string>;
	  }
	| {
			pathname: Pathname;
			search?: Record<string, string>;
	  };

type RelativeRoutingType = 'route' | 'path';

export type RouteName = keyof IRouterPaths;

export type RouteParameters = Record<string, string>;

export type QueryStringParameters = Record<string, string>;

export type RouteGroupName = string;

export type RouterContextValue = {
	getRoutePath<TPathPattern extends RouterPathPattern>(
		pattern: TPathPattern,
		parameters?: Record<string, string>,
		search?: Record<string, string>,
	): string;
	getRoutePath<TRouteName extends RouterPathName>(
		name: TRouteName,
		parameters?: Record<string, string>,
		search?: Record<string, string>,
	): string;
	navigate(to: To, options?: { replace?: boolean; state?: any; relative?: RelativeRoutingType }): void;
	navigate(delta: number): void;
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
	pushRoute: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters?: ((prev: Record<string, string>) => Record<string, string>) | Record<string, string>,
	) => void;
	replaceRoute: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters?: ((prev: Record<string, string>) => Record<string, string>) | Record<string, string>,
	) => void;
	queryRouteParameter: (name: string) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string | undefined];
	queryQueryStringParameter: (
		name: string,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string | undefined];
	queryCurrentRoute: () => [
		subscribe: (onStoreChange: () => void) => () => void,
		getSnapshot: () => [RouteName?, RouteParameters?, QueryStringParameters?, RouteGroupName?],
	];
	setQueryString(parameters: Record<string, string | null>): void;
	setQueryString(fn: (parameters: Record<string, string>) => Record<string, string>): void;
};

export const RouterContext = createContext<RouterContextValue>({
	getRoutePath: () => {
		throw new Error('not implemented');
	},
	navigate: () => undefined,
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
	setQueryString: () => undefined,
});
