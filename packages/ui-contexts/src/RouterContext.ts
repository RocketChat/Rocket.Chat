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

export type LocationPathname = IRouterPaths[keyof IRouterPaths]['pathname'];
export type LocationSearch = string;

export type RouteParameters = Record<string, string>;
export type SearchParameters = Record<string, string>;

export type RouteName = keyof IRouterPaths;
export type RouterPathPattern = IRouterPaths[keyof IRouterPaths]['pattern'];

export type To =
	| LocationPathname
	| {
			name: RouteName;
			params?: RouteParameters;
			search?: SearchParameters;
	  }
	| {
			pattern: RouterPathPattern;
			params?: RouteParameters;
			search?: SearchParameters;
	  }
	| {
			pathname: LocationPathname;
			search?: SearchParameters;
	  };

type RelativeRoutingType = 'route' | 'path';

export type QueryStringParameters = SearchParameters;

export type RouteGroupName = string;

export type RouterContextValue = {
	subscribeToRouteChange(onRouteChange: () => void): () => void;
	getLocationPathname(): LocationPathname;
	getLocationSearch(): LocationSearch;
	getRouteParameters(): RouteParameters;
	getSearchParameters(): SearchParameters;
	getRouteName(): RouteName | undefined;
	buildRoutePath(to: To): LocationPathname | `${LocationPathname}?${LocationSearch}`;
	navigate(to: To, options?: { replace?: boolean; state?: any; relative?: RelativeRoutingType }): void;
	navigate(delta: number): void;
	queryRoutePath: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string | undefined];
	queryCurrentRoute: () => [
		subscribe: (onStoreChange: () => void) => () => void,
		getSnapshot: () => [RouteName?, RouteParameters?, QueryStringParameters?, RouteGroupName?],
	];
};

export const RouterContext = createContext<RouterContextValue>({
	subscribeToRouteChange: () => () => undefined,
	getLocationPathname: () => {
		throw new Error('not implemented');
	},
	getRouteParameters: () => {
		throw new Error('not implemented');
	},
	getLocationSearch: () => {
		throw new Error('not implemented');
	},
	getSearchParameters: () => ({}),
	getRouteName: () => {
		throw new Error('not implemented');
	},
	buildRoutePath: () => {
		throw new Error('not implemented');
	},
	navigate: () => undefined,
	queryRoutePath: () => [() => (): void => undefined, (): undefined => undefined],
	queryCurrentRoute: () => [
		() => (): void => undefined,
		(): [undefined, RouteParameters, QueryStringParameters, undefined] => [undefined, {}, {}, undefined],
	],
});
