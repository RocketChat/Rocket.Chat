import { Emitter } from '@rocket.chat/emitter';
import type {
	LocationPathname,
	LocationSearch,
	RouteName,
	RouteObject,
	RouteParameters,
	SearchParameters,
	To,
} from '@rocket.chat/ui-contexts';

import page, { Context } from './page';
import type { RouteOptions } from './route';
import Route from './route';
import { appLayout } from '../lib/appLayout';

type Current = Readonly<{
	path: string;
	params: Map<string, string>;
	route: Route;
	context: Context;
	oldRoute: Route | undefined;
	queryParams: URLSearchParams;
}>;

class Router {
	private readonly pathRegExp = /(:[\w\(\)\\\+\*\.\?\[\]\-]+)+/g;

	private readonly queryRegExp = /\?([^\/\r\n].*)/;

	private _current: Current | undefined = undefined;

	private readonly _specialChars = ['/', '%', '+'];

	private _encodeParam(param: string) {
		const paramArr = param.split('');
		let _param = '';
		for (const p of paramArr) {
			if (this._specialChars.includes(p)) {
				_param += encodeURIComponent(encodeURIComponent(p));
			} else {
				try {
					_param += encodeURIComponent(p);
				} catch (e) {
					_param += p;
				}
			}
		}
		return _param;
	}

	private _initialized = false;

	private _routes = new Set<Route>();

	private _routesMap = new Map<string, Route>();

	private safeToRun = 0;

	private readonly _basePath = window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	private _oldRouteChain: (Route | undefined)[] = [];

	constructor() {
		this.route('*', {});
		this._updateCallbacks();
	}

	private emitter = new Emitter<{ pathChanged: void }>();

	route(pathDef: string, options: RouteOptions) {
		if (!/^\//.test(pathDef) && pathDef !== '*') {
			throw new Error("route's path must start with '/'");
		}

		const route = new Route(pathDef, options);

		route._actionHandle = (context: Context) => {
			const oldRoute = this._current?.route;
			this._oldRouteChain.push(oldRoute);

			const queryParams = new URLSearchParams(context.querystring);
			this._current = Object.freeze({
				path: context.path,
				params: new Map(Object.entries<string>(context.params)),
				route,
				context,
				oldRoute,
				queryParams,
			});

			this._invalidateTracker();
		};

		this._routes.add(route);
		if (options.name) {
			this._routesMap.set(options.name, route);
		}

		this._updateCallbacks();

		return route;
	}

	path(pathDef: string, params: Record<string, string | null> = {}, queryParams: Record<string, string | null> = {}): string {
		if (this._routesMap.has(pathDef)) {
			pathDef = this._routesMap.get(pathDef)?.pathDef ?? pathDef;
		}

		if (this.queryRegExp.test(pathDef)) {
			const [pathDefPart, searchPart] = pathDef.split(this.queryRegExp);
			pathDef = pathDefPart;
			if (searchPart) {
				queryParams = Object.assign(Object.fromEntries(new URLSearchParams(searchPart).entries()), queryParams);
			}
		}

		let path = '';

		if (this._basePath) {
			path += `/${this._basePath}/`;
		}

		path += pathDef.replace(this.pathRegExp, (_key) => {
			const firstRegexpChar = _key.indexOf('(');
			let key = _key.substring(1, firstRegexpChar > 0 ? firstRegexpChar : undefined);
			key = key.replace(/[\+\*\?]+/g, '');

			if (params[key]) {
				return this._encodeParam(`${params[key]}`);
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

	get current() {
		return this._current;
	}

	initialize() {
		if (this._initialized) {
			throw new Error('FlowRouter is already initialized');
		}

		this._updateCallbacks();

		page.setBase(this._basePath);

		page.start();
		this._initialized = true;

		queueMicrotask(() => {
			this.emitter.emit('pathChanged');
		});
	}

	private refresh() {
		if (!this._current?.route) return;

		const currentContext = this._current;
		const { route } = currentContext;

		if (this.safeToRun === 0) {
			throw new Error("You can't use reactive data sources like Session inside the `.subscriptions` method!");
		}

		let isRouteChange = currentContext.oldRoute !== currentContext.route;
		if (!currentContext.oldRoute) {
			isRouteChange = false;
		}

		this._oldRouteChain = [];

		if (!isRouteChange) {
			this.emitter.emit('pathChanged');
		}
		route.action();

		queueMicrotask(() => {
			this.emitter.emit('pathChanged');
		});

		this.safeToRun--;
	}

	private _invalidateTracker() {
		this.safeToRun++;
		this.refresh();
	}

	_updateCallbacks() {
		page.callbacks = [];

		let catchAll: Route | null = null;

		for (const route of this._routes) {
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

	// public methods

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
			return this.path(pattern, params, search) as LocationPathname | `${LocationPathname}?${LocationSearch}`;
		}

		if ('name' in to) {
			const { name, params = {}, search = {} } = to;
			return this.path(name, params, search) as LocationPathname | `${LocationPathname}?${LocationSearch}`;
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
		if (this._initialized) {
			this._updateCallbacks();
			if (this.current) page.dispatch(new Context(this.current.path));
			return;
		}

		this.initialize();
	}

	readonly defineRoutes = (routes: readonly RouteObject[]) => {
		const flowRoutes = routes.map((route) =>
			this.route(route.path, {
				name: route.id,
				action: () => appLayout.render(<>{route.element}</>),
			}),
		);

		this.updateRoutes();

		return () => {
			flowRoutes.forEach((flowRoute) => {
				this._routes.add(flowRoute);
				if ('name' in flowRoute && flowRoute.name) {
					this._routesMap.delete(flowRoute.name);
				}
			});

			this.updateRoutes();
		};
	};
}

export default Router;
