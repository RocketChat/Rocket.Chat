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
export type RouterPathname = IRouterPaths[keyof IRouterPaths]['pathname'];

type To =
	| RouterPathname
	| {
			pattern: RouterPathPattern;
			params: Record<string, string>;
			search?: Record<string, string>;
	  }
	| {
			pathname: RouterPathname;
			search?: Record<string, string>;
	  };

type PathMatch<TPathPattern extends RouterPathPattern> = {
	params: Record<string, string>;
	pathname: string;
	pattern: TPathPattern;
};

type RelativeRoutingType = 'route' | 'path';

export type RouteName = keyof IRouterPaths;

export type RouteParameters = Record<string, string>;

export type QueryStringParameters = Record<string, string>;

export type RouteGroupName = string;

export type RouterContextValue = {
	subscribeToRouteChange(onRouteChange: () => void): () => void;
	getPathname(): RouterPathname;
	getParameters(): Record<string, string>;
	getSearch(): string;
	getSearchParameters(): Record<string, string>;
	matchPath<TPathPattern extends RouterPathPattern>(pattern: TPathPattern, pathname: string): PathMatch<TPathPattern> | null;
	getRoutePatternByName<TRouteName extends RouterPathName>(name: TRouteName): IRouterPaths[TRouteName]['pattern'];
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
	queryCurrentRoute: () => [
		subscribe: (onStoreChange: () => void) => () => void,
		getSnapshot: () => [RouteName?, RouteParameters?, QueryStringParameters?, RouteGroupName?],
	];
};

export const RouterContext = createContext<RouterContextValue>({
	getRoutePath: () => {
		throw new Error('not implemented');
	},
	navigate: () => undefined,
	subscribeToRouteChange: () => () => undefined,
	getPathname: () => {
		throw new Error('not implemented');
	},
	getParameters: () => {
		throw new Error('not implemented');
	},
	getSearch: () => {
		throw new Error('not implemented');
	},
	getSearchParameters: () => ({}),
	matchPath: () => {
		throw new Error('not implemented');
	},
	getRoutePatternByName: () => {
		throw new Error('not implemented');
	},
	queryRoutePath: () => [() => (): void => undefined, (): undefined => undefined],
	pushRoute: () => undefined,
	replaceRoute: () => undefined,
	queryRouteParameter: () => [() => (): void => undefined, (): undefined => undefined],
	queryCurrentRoute: () => [
		() => (): void => undefined,
		(): [undefined, RouteParameters, QueryStringParameters, undefined] => [undefined, {}, {}, undefined],
	],
});
