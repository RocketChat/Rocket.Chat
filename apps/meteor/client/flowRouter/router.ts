import { Tracker } from 'meteor/tracker';

import type { Context } from './page';
import page from './page';
import type { RouteOptions } from './route';
import Route from './route';

export type Current = Readonly<{
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

	private readonly _tracker = this._buildTracker();

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

	private readonly _onEveryPath = new Tracker.Dependency();

	_initialized = false;

	_routes = new Set<Route>();

	_routesMap = new Map<string, Route>();

	private safeToRun = 0;

	private readonly _basePath = window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	private _oldRouteChain: (Route | undefined)[] = [];

	constructor() {
		this.route('*', {});
		this._updateCallbacks();
	}

	watchPathChange(): void {
		const currentRoute = this._current?.route;
		if (!currentRoute) {
			this._onEveryPath.depend();
			return undefined;
		}

		return currentRoute.watchPathChange.call(currentRoute);
	}

	readonly _page = page;

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

	private go(pathDef: string, { reload = false }: { reload?: boolean } = {}): void {
		page.show(this.path(pathDef), { reload });
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
	}

	private _buildTracker() {
		const tracker = Tracker.autorun(() => {
			if (!this._current?.route) {
				return;
			}

			const currentContext = this._current;
			const { route } = currentContext;

			if (this.safeToRun === 0) {
				throw new Error("You can't use reactive data sources like Session inside the `.subscriptions` method!");
			}

			Tracker.nonreactive(() => {
				let isRouteChange = currentContext.oldRoute !== currentContext.route;
				if (!currentContext.oldRoute) {
					isRouteChange = false;
				}

				const oldestRoute = this._oldRouteChain[0];
				this._oldRouteChain = [];

				currentContext.route.registerRouteChange(isRouteChange);
				route.callAction();

				Tracker.afterFlush(() => {
					this._onEveryPath.changed();
					if (isRouteChange) {
						if (oldestRoute?.registerRouteClose) {
							oldestRoute.registerRouteClose();
						}
					}
				});
			});

			this.safeToRun--;
		});

		return tracker;
	}

	private _nextPath: string | undefined;

	private _invalidateTracker() {
		this.safeToRun++;
		this._tracker.invalidate();

		if (!Tracker.currentComputation) {
			try {
				Tracker.flush();
			} catch (ex) {
				if (!/Tracker\.flush while flushing/.test((ex as Error).message)) {
					return;
				}

				queueMicrotask(() => {
					const path = this._nextPath;
					if (!path) return;

					delete this._nextPath;
					this.go(path, { reload: true });
				});
			}
		}
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
}

export default Router;
