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

import { Context, Page } from './page';
import { appLayout } from '../lib/appLayout';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

export class Router implements RouterContextValue {
	private readonly pathRegExp = /(:[\w\(\)\\\+\*\.\?\[\]\-]+)+/g;

	private readonly queryRegExp = /\?([^\/\r\n].*)/;

	private current:
		| Readonly<{
				path: string;
				params: Map<string, string>;
				route: Route;
				context: Context;
				oldRoute: Route | undefined;
				queryParams: URLSearchParams;
		  }>
		| undefined = undefined;

	private readonly specialChars = ['/', '%', '+'];

	private initialized = false;

	private routes = new Set<Route>();

	private pathDefById = new Map<Route['pathDef'], Route['id']>();

	private readonly basePath = window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	private readonly page = new Page();

	constructor() {
		this.registerRoute('*', { id: 'not-found' });
		this.updateCallbacks();
	}

	private emitter = new Emitter<{ pathChanged: void }>();

	private registerRoute(pathDef: string, options: RouteOptions) {
		if (!/^\//.test(pathDef) && pathDef !== '*') {
			throw new Error("route's path must start with '/'");
		}

		const route = new Route(pathDef, options);

		route.actionHandle = (context: Context) => {
			const oldRoute = this.current?.route;

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
		this.pathDefById.set(options.id, route.pathDef);

		this.updateCallbacks();

		return route;
	}

	private encodePath(
		idOrPathDef: string,
		params: Record<string, string | null> = {},
		queryParams: Record<string, string | null> = {},
	): string {
		if (this.pathDefById.has(idOrPathDef)) {
			idOrPathDef = this.pathDefById.get(idOrPathDef) ?? idOrPathDef;
		}

		if (this.queryRegExp.test(idOrPathDef)) {
			const [pathDefPart, searchPart] = idOrPathDef.split(this.queryRegExp);
			idOrPathDef = pathDefPart;
			if (searchPart) {
				queryParams = Object.assign(Object.fromEntries(new URLSearchParams(searchPart).entries()), queryParams);
			}
		}

		let path = '';

		if (this.basePath) {
			path += `/${this.basePath}/`;
		}

		path += idOrPathDef.replace(this.pathRegExp, (_key) => {
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

		this.page.setBase(this.basePath);

		this.page.start();
		this.initialized = true;

		queueMicrotask(() => {
			this.emitter.emit('pathChanged');
		});
	}

	private refresh() {
		if (!this.current?.route) return;

		const currentContext = this.current;
		const { route } = currentContext;

		let isRouteChange = currentContext.oldRoute !== currentContext.route;
		if (!currentContext.oldRoute) {
			isRouteChange = false;
		}

		if (!isRouteChange) {
			this.emitter.emit('pathChanged');
		}

		route.action();

		queueMicrotask(() => {
			this.emitter.emit('pathChanged');
		});
	}

	private updateCallbacks() {
		this.page.clearRoutes();

		let catchAll: Route | null = null;

		for (const route of this.routes) {
			if (route.pathDef === '*') {
				catchAll = route;
			} else {
				this.page.registerRoute(route.pathDef, route.actionHandle);
			}
		}

		if (catchAll) {
			this.page.registerRoute(catchAll.pathDef, catchAll.actionHandle);
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

	readonly getRouteName = () => this.current?.route?.id as RouteName | undefined;

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

	readonly defineRoutes = (routes: readonly RouteObject[]) => {
		if (!this.initialized) this.initialize();

		const flowRoutes = routes.map((route) =>
			this.registerRoute(route.path, {
				id: route.id,
				action: () => appLayout.render(<>{route.element}</>),
			}),
		);

		if (this.current) this.page.dispatch(new Context(this.page, this.current.path));

		return () => {
			flowRoutes.forEach((flowRoute) => {
				this.routes.delete(flowRoute);
				this.pathDefById.delete(flowRoute.id);
			});

			this.updateCallbacks();
			if (this.current) this.page.dispatch(new Context(this.page, this.current.path));
		};
	};

	readonly getRoomRoute = (roomType: RoomType, routeData: RoomRouteData) => {
		return { path: roomCoordinator.getRouteLink(roomType, routeData) || '/' };
	};
}

type RouteOptions = {
	id: string;
	action?: () => void;
};

class Route {
	readonly action: () => void | Promise<void>;

	readonly id: string;

	constructor(
		public readonly pathDef: string,
		public readonly options: RouteOptions,
	) {
		this.action = options.action ?? (() => undefined);
		this.id = options.id;
	}

	actionHandle: (ctx: Context) => void;
}
