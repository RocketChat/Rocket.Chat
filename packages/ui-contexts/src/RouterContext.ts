import type { ReactNode } from 'react';
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

export type RouteObject =
	| {
			path: RouterPathPattern;
			id: RouteName;
			element: ReactNode;
	  }
	| {
			path: '*';
			id: 'not-found';
			element: ReactNode;
	  };

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
	defineRoutes(routes: RouteObject[]): () => void;
	getRoutes(): RouteObject[];
	subscribeToRoutesChange(onRoutesChange: () => void): () => void;
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
	getSearchParameters: () => {
		throw new Error('not implemented');
	},
	getRouteName: () => {
		throw new Error('not implemented');
	},
	buildRoutePath: () => {
		throw new Error('not implemented');
	},
	navigate: () => undefined,
	defineRoutes: () => () => undefined,
	getRoutes: () => {
		throw new Error('not implemented');
	},
	subscribeToRoutesChange: () => () => undefined,
});
