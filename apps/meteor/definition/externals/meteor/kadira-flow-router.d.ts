declare module 'meteor/kadira:flow-router' {
	import type { Subscription } from 'meteor/meteor';

	type Context = {
		params: Record<string, string>;
		queryParams: Record<string, string>;
	};

	export type RouteOptions = {
		name: string;
		action?: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string>) => void;
		subscriptions?: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string>) => void;
		triggersEnter?: ((context: Context, redirect: (pathDef: string) => void, stop: () => void) => void)[];
		triggersExit?: ((context: Context) => void)[];
	};

	class Route {
		constructor(router: Router, pathDef: string, options?: RouteOptions, group?: Group);

		options: RouteOptions;

		pathDef: string;

		path: string;

		name?: string;

		group?: Group;

		clearSubscriptions(): void;

		register(name: string, sub: Subscription, options?: never): void; // `options` is unused in FlowRouter code

		getSubscription(name: string): Subscription;

		getAllSubscriptions(): Record<string, Subscription>;

		callAction(current: Current): void;

		callSubscriptions(current: Current): void;

		getRouteName(): string;

		getParam(key: string): string;

		getQueryParam(key: string): string;

		watchPathChange(): void;

		registerRouteClose(): void;

		registerRouteChange(currentContext: Context, routeChanging?: boolean): void;
	}

	type GroupOptions = {
		name: string;
		prefix?: string;
		triggersEnter?: unknown[];
		triggersExit?: unknown[];
		subscriptions?: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string>) => void;
	};

	class Group {
		constructor(router: Router, options?: GroupOptions, parent?: Group);

		name: string;

		prefix: string;

		options: GroupOptions;

		parent: Group | undefined;

		route(pathDef: string, options?: RouteOptions, group?: Group): Route;

		group(options?: GroupOptions): Group;

		callSubscriptions(current: Current): void;
	}

	type Current = {
		path: string;
		context: Context;
		params: Record<string, string>;
		queryParams: Record<string, string>;
		route?: Route | undefined;
		oldRoute?: Route | undefined;
	};

	type RouterOptions = {
		hashbang?: boolean;
	};

	class Router {
		constructor();

		route(pathDef: string, options: RouteOptions, group?: Group): void;

		group(options: GroupOptions): Group;

		path(pathDef: string, fields?: Record<string, string>, queryParams?: Record<string, string>): string;

		url(pathDef: string, fields?: Record<string, string>, queryParams?: Record<string, string>): string;

		go(pathDef: string, fields?: Record<string, string>, queryParams?: Record<string, string>): void;

		reload(): void;

		redirect(path: string): void;

		setParams(newParams: Record<string, string>): boolean;

		setQueryParams(newParams: Record<string, string | null>): boolean;

		current(): Current;

		subsReady(): boolean;

		withReplaceState(fn: () => void): Router;

		withTrailingSlash(fn: () => void): Router;

		initialize(options?: RouterOptions): void;

		wait(): void;

		notFound: Omit<RouteOptions, 'name'>;

		getRouteName(): string;

		getParam(key: string): string;

		getQueryParam(key: string): string;

		watchPathChange(): void;
	}

	export const FlowRouter: Router & {
		Route: typeof Route;
		Router: typeof Router;
	};
}
