import { createContext } from 'react';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface Paths {
	index: {
		pattern: '/';
		pathname: '/';
	};
	home: {
		pattern: '/home';
		pathname: '/home';
	};
}

type Pathname = Paths[keyof Paths]['pathname'];
type Search = string;
type Hash = string;

type Path = {
	pathname: Pathname;
	search: Search;
	hash: Hash;
};

type To = Pathname | Partial<Path>;

type RelativeRoutingType = 'route' | 'path';

export type NavigateFunction = {
	(
		to: To,
		options?: {
			replace?: boolean;
			state?: any;
			relative?: RelativeRoutingType;
		},
	): void;
	(delta: number): void;
};

export type RouteName = keyof Paths;

export type RouteParameters = Record<string, string>;

export type QueryStringParameters = Record<string, string>;

export type RouteGroupName = string;

export type RouterContextValue = {
	navigate: NavigateFunction;
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
	getRoutePath(nameOrPathDef: string, parameters?: Record<string, string>, queryStringParameters?: Record<string, string>): string;
};

export const RouterContext = createContext<RouterContextValue>({
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
	getRoutePath: () => {
		throw new Error('not implemented');
	},
});

export type { Paths as RouterPaths };
