declare module 'meteor/kadira:flow-router' {
	import type { Subscription } from 'meteor/meteor';
	import type { RouterPaths } from '@rocket.chat/ui-contexts';

	type RouteName = keyof RouterPaths;

	type GroupName = RouteName extends infer U ? (U extends `${infer TGroupName}-index` ? TGroupName : never) : never;
	type GroupPrefix<TGroupName extends GroupName> = RouterPaths[`${TGroupName}-index`]['pattern'];
	type RouteNamesOf<TGroupName extends GroupName> = Extract<
		| keyof {
				[TRouteName in RouteName as RouterPaths[TRouteName]['pattern'] extends `${GroupPrefix<TGroupName>}/${string}`
					? TRouteName
					: never]: Route<TRouteName>;
		  }
		| `${GroupName}-index`,
		RouteName
	>;
	type TrimPrefix<T extends string, P extends string> = T extends `${P}${infer U}` ? U : T;

	type Context = {
		params: Record<string, string>;
		queryParams: Record<string, string>;
		pathname: string;
		oldRoute?: Route<RouteName, any>;
		route: Route<RouteName, any>;
	};

	type RouteOptions<TRouteName extends RouteName> = {
		name?: TRouteName;
		action?: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string | string[]>) => void;
		subscriptions?: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string | string[]>) => void;
		triggersEnter?: ((context: Context, redirect: (path: string) => void, stop: () => void) => void)[];
		triggersExit?: ((context: Context) => void)[];
	};

	class Route<TRouteName extends RouteName, TGroup extends Group<GroupName> | undefined = any> {
		constructor(router: Router, pathDef: RouterPaths[TRouteName]['pattern'], options?: RouteOptions<TRouteName>, group?: TGroup);

		options: RouteOptions<TRouteName>;

		pathDef: RouterPaths[TRouteName]['pattern'];

		path: string;

		name?: TRouteName;

		group?: TGroup;

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

	type GroupOptions<TGroupName extends RouteName> = {
		name: TGroupName;
		prefix?: GroupPrefix<TGroupName>;
		triggersEnter?: unknown[];
		triggersExit?: unknown[];
		subscriptions?: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string | string[]>) => void;
	};

	class Group<TGroupName extends GroupName, TParentGroup extends Group<GroupName> | undefined = any> {
		constructor(router: Router, options?: GroupOptions<TGroupName>, parent?: TParentGroup);

		name: TGroupName;

		prefix: GroupPrefix<TGroupName>;

		options: GroupOptions<TGroupName>;

		parent: TParentGroup;

		route<TRouteName extends RouteNamesOf<TGroupName>>(
			pathDef: TrimPrefix<RouterPaths[TRouteName]['pattern'], GroupPrefix<TGroupName>>,
			options: RouteOptions<TRouteName>,
			group?: TParentGroup,
		): Route<TRouteName, TGroup>;

		group(options?: GroupOptions<TGroupName>): Group;

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

		route<TRouteName extends RouteName>(
			pathDef: RouterPaths[TRouteName]['pattern'],
			options: RouteOptions<TRouteName>,
		): Route<TRouteName, undefined>;

		route<TRouteName extends RouteName, TGroup extends Group<RouteName>>(
			pathDef: RouterPaths[TRouteName]['pattern'],
			options: RouteOptions<TRouteName>,
			group: TGroup,
		): Route<TRouteName, TGroup>;

		group<TGroupName extends GroupName>(options: GroupOptions<TGroupName>): Group<TGroupName>;

		path(pathDef: string, fields?: Record<string, string>, queryParams?: Record<string, string | string[]>): string;

		url(pathDef: string, fields?: Record<string, string>, queryParams?: Record<string, string | string[]>): string;

		go(pathDef: string, fields?: Record<string, string>, queryParams?: Record<string, string | string[]>): void;

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

		notFound: Omit<RouteOptions<any>, 'name'>;

		getRouteName(): RouteName;

		getParam(key: string): string;

		getQueryParam(key: string): string;

		watchPathChange(): void;

		_initialized: boolean;

		_routes: Route[];

		_routesMap: Record<string, Route>;

		_updateCallbacks(): void;
	}

	const FlowRouter: Router & {
		Route: typeof Route;
		Router: typeof Router;
	};
}
