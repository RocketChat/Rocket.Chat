import { createContext } from 'react';
import type { Subscription } from 'use-subscription';

export type RouteName = string;

export type RouteParameters = Record<string, string>;

export type QueryStringParameters = Record<string, string>;

export type RouteGroupName = string;

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
	pushRoute: (name: RouteName, parameters: RouteParameters | undefined, queryStringParameters: QueryStringParameters | undefined) => void;
	replaceRoute: (
		name: RouteName,
		parameters: RouteParameters | undefined,
		queryStringParameters: QueryStringParameters | undefined,
	) => void;
	queryRouteParameter: (name: string) => Subscription<string | undefined>;
	queryQueryStringParameter: (name: string) => Subscription<string | undefined>;
	queryCurrentRoute: () => Subscription<[RouteName?, RouteParameters?, QueryStringParameters?, RouteGroupName?]>;
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
