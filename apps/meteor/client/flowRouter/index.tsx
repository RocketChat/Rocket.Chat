import type { RoomType, RoomRouteData } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type {
	LocationPathname,
	LocationSearch,
	RouteName,
	RouteObject,
	RouteParameters,
	RouterContextValue,
	SearchParameters,
	To,
} from '@rocket.chat/ui-contexts';

import page, { Context } from './page';
import type { RouteOptions } from './route';
import Route from './route';
import { appLayout } from '../lib/appLayout';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

type Current = Readonly<{
	path: string;
	params: Map<string, string>;
	route: Route;
	context: Context;
	oldRoute: Route | undefined;
	queryParams: URLSearchParams;
}>;

export class Router implements RouterContextValue {
	private readonly pathRegExp = /(:[\w\(\)\\\+\*\.\?\[\]\-]+)+/g;

	private readonly queryRegExp = /\?([^\/\r\n].*)/;

	private current: Current | undefined = undefined;

	private readonly specialChars = ['/', '%', '+'];

	private initialized = false;

	private routes = new Set<Route>();

	private routesByPathdef = new Map<string, Route>();

	private safeToRun = 0;

	private readonly basePath = window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	private oldRouteChain: (Route | undefined)[] = [];

	constructor() {
		this.registerRoute('*', {});
		this.updateCallbacks();
	}

	private emitter = new Emitter<{ pathChanged: void }>();

	private registerRoute(pathDef: string, options: RouteOptions) {
		if (!/^\//.test(pathDef) && pathDef !== '*') {
			throw new Error("route's path must start with '/'");
		}

		const route = new Route(pathDef, options);

		route._actionHandle = (context: Context) => {
			const oldRoute = this.current?.route;
			this.oldRouteChain.push(oldRoute);

			const queryParams = new URLSearchParams(context.querystring);
			this.current = Object.freeze({
				path: context.path,
				params: new Map(Object.entries<string>(context.params)),
				route,
				context,
				oldRoute,
				queryParams,
			});

			this.refresh();
		};

		this.routes.add(route);
		if (options.name) {
			this.routesByPathdef.set(options.name, route);
		}

		this.updateCallbacks();

		return route;
	}

	private encodePath(pathDef: string, params: Record<string, string | null> = {}, queryParams: Record<string, string | null> = {}): string {
		if (this.routesByPathdef.has(pathDef)) {
			pathDef = this.routesByPathdef.get(pathDef)?.pathDef ?? pathDef;
		}

		if (this.queryRegExp.test(pathDef)) {
			const [pathDefPart, searchPart] = pathDef.split(this.queryRegExp);
			pathDef = pathDefPart;
			if (searchPart) {
				queryParams = Object.assign(Object.fromEntries(new URLSearchParams(searchPart).entries()), queryParams);
			}
		}

		let path = '';

		if (this.basePath) {
			path += `/${this.basePath}/`;
		}

		path += pathDef.replace(this.pathRegExp, (_key) => {
			const firstRegexpChar = _key.indexOf('(');
			let key = _key.substring(1, firstRegexpChar > 0 ? firstRegexpChar : undefined);
			key = key.replace(/[\+\*\?]+/g, '');

			if (params[key]) {
				return this.encodeParam(`${params[key]}`);
			}

			return '';
		});

		path = path.replace(/\/\/+/g, '/');

		path = path.match(/^\/{1}$/) ? path : path.replace(/\/$/, '');

		const strQueryParams = new URLSearchParams(
			Object.entries(queryParams).filter((pair): pair is [string, string] => pair[1] !== null && pair[1] !== undefined),
		).toString();
		if (strQueryParams) {
			path += `?${strQueryParams}`;
		}

		path = path.replace(/\/\/+/g, '/');
		return path;
	}

	private encodeParam(param: string) {
		const paramArr = param.split('');
		let buffer = '';
		for (const p of paramArr) {
			if (this.specialChars.includes(p)) {
				buffer += encodeURIComponent(encodeURIComponent(p));
			} else {
				try {
					buffer += encodeURIComponent(p);
				} catch (e) {
					buffer += p;
				}
			}
		}
		return buffer;
	}

	private initialize() {
		if (this.initialized) {
			throw new Error('FlowRouter is already initialized');
		}

		this.updateCallbacks();

		page.setBase(this.basePath);

		page.start();
		this.initialized = true;

		queueMicrotask(() => {
			this.emitter.emit('pathChanged');
		});
	}

	private refresh() {
		this.safeToRun++;

		if (!this.current?.route) return;

		const currentContext = this.current;
		const { route } = currentContext;

		if (this.safeToRun === 0) {
			throw new Error("You can't use reactive data sources like Session inside the `.subscriptions` method!");
		}

		let isRouteChange = currentContext.oldRoute !== currentContext.route;
		if (!currentContext.oldRoute) {
			isRouteChange = false;
		}

		this.oldRouteChain = [];

		if (!isRouteChange) {
			this.emitter.emit('pathChanged');
		}
		route.action();

		queueMicrotask(() => {
			this.emitter.emit('pathChanged');
		});

		this.safeToRun--;
	}

	private updateCallbacks() {
		page.callbacks = [];

		let catchAll: Route | null = null;

		for (const route of this.routes) {
			if (route.pathDef === '*') {
				catchAll = route;
			} else {
				page.registerRoute(route.pathDef, route._actionHandle);
			}
		}

		if (catchAll) {
			page.registerRoute(catchAll.pathDef, catchAll._actionHandle);
		}
	}

	// router context implementation

	readonly subscribeToRouteChange = (onRouteChange: () => void): (() => void) => {
		const unsubscribe = this.emitter.on('pathChanged', onRouteChange);

		this.emitter.emit('pathChanged'); // FIXME

		return () => {
			unsubscribe();
		};
	};

	readonly getLocationPathname = () => this.current?.path.replace(/\?.*/, '') as LocationPathname;

	readonly getLocationSearch = () => location.search as LocationSearch;

	readonly getRouteParameters = () => (this.current?.params ? (Object.fromEntries(this.current.params.entries()) as RouteParameters) : {});

	readonly getSearchParameters = () =>
		this.current?.queryParams ? (Object.fromEntries(this.current.queryParams.entries()) as SearchParameters) : {};

	readonly getRouteName = () => this.current?.route?.name as RouteName | undefined;

	private encodeSearchParameters(searchParameters: SearchParameters) {
		const search = new URLSearchParams();

		for (const [key, value] of Object.entries(searchParameters)) {
			search.append(key, value);
		}

		const searchString = search.toString();

		return searchString ? `?${searchString}` : '';
	}

	readonly buildRoutePath = (to: To): LocationPathname | `${LocationPathname}?${LocationSearch}` => {
		if (typeof to === 'string') {
			return to;
		}

		if ('pathname' in to) {
			const { pathname, search = {} } = to;
			return (pathname + this.encodeSearchParameters(search)) as LocationPathname | `${LocationPathname}?${LocationSearch}`;
		}

		if ('pattern' in to) {
			const { pattern, params = {}, search = {} } = to;
			return this.encodePath(pattern, params, search) as LocationPathname | `${LocationPathname}?${LocationSearch}`;
		}

		if ('name' in to) {
			const { name, params = {}, search = {} } = to;
			return this.encodePath(name, params, search) as LocationPathname | `${LocationPathname}?${LocationSearch}`;
		}

		throw new Error('Invalid route');
	};

	readonly navigate = (
		toOrDelta: To | number,
		options?: {
			replace?: boolean;
		},
	) => {
		if (typeof toOrDelta === 'number') {
			history.go(toOrDelta);
			return;
		}

		const path = this.buildRoutePath(toOrDelta);
		const state = { path };

		if (options?.replace) {
			history.replaceState(state, '', path);
		} else {
			history.pushState(state, '', path);
		}

		dispatchEvent(new PopStateEvent('popstate', { state }));
	};

	private updateRoutes() {
		if (this.initialized) {
			this.updateCallbacks();
			if (this.current) page.dispatch(new Context(this.current.path));
			return;
		}

		this.initialize();
	}

	readonly defineRoutes = (routes: readonly RouteObject[]) => {
		const flowRoutes = routes.map((route) =>
			this.registerRoute(route.path, {
				name: route.id,
				action: () => appLayout.render(<>{route.element}</>),
			}),
		);

		this.updateRoutes();

		return () => {
			flowRoutes.forEach((flowRoute) => {
				this.routes.add(flowRoute);
				if ('name' in flowRoute && flowRoute.name) {
					this.routesByPathdef.delete(flowRoute.name);
				}
			});

			this.updateRoutes();
		};
	};

	readonly getRoomRoute = (roomType: RoomType, routeData: RoomRouteData) => {
		return { path: roomCoordinator.getRouteLink(roomType, routeData) || '/' };
	};
}
