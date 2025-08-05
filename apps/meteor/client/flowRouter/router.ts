import { Meteor } from 'meteor/meteor';
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

	// tracks the current path change
	private readonly _onEveryPath = new Tracker.Dependency();

	_initialized = false;

	_routes = new Set<Route>();

	_routesMap = new Map<string, Route>();

	// indicate it's okay (or not okay) to run the tracker
	// when doing subscriptions
	// using a number and increment it help us to support FlowRouter.go()
	// and legitimate reruns inside tracker on the same event loop.
	// this is a solution for #145
	private safeToRun = 0;

	// Meteor exposes to the client the path prefix that was defined using the
	// ROOT_URL environement variable on the server using the global runtime
	// configuration. See #315.
	private readonly _basePath = window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	// this is a chain contains a list of old routes
	// most of the time, there is only one old route
	// but when it's the time for a trigger redirect we've a chain
	private _oldRouteChain: (Route | undefined)[] = [];

	private readonly env = {
		reload: new Meteor.EnvironmentVariable(),
	};

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

		// calls when the page route being activates
		route._actionHandle = (context: Context) => {
			const oldRoute = this._current?.route;
			this._oldRouteChain.push(oldRoute);

			// _qs.parse() gives us a object without prototypes,
			// created with Object.create(null)
			// Meteor's check doesn't play nice with it.
			// So, we need to fix it by cloning it.
			// see more: https://github.com/meteorhacks/flow-router/issues/164

			// In addition to the above, query params also inappropriately
			// get decoded twice. The ternary below fixes this bug if the
			// "decodeQueryParamsOnce" option is set to true, so that we
			// don't break legacy applications. The "example.com" domain
			// below is insignificant but only used to create a URL object
			// from which we can parse out query params reliably from the
			// still-encoded path instead of the prematurely decoded
			// querystring.
			// See: https://github.com/veliovgroup/flow-router/issues/78
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

		// Prefix the path with the router global prefix
		if (this._basePath) {
			path += `/${this._basePath}/`;
		}

		path += pathDef.replace(this.pathRegExp, (_key) => {
			const firstRegexpChar = _key.indexOf('(');
			// get the content behind : and (\\d+/)
			let key = _key.substring(1, firstRegexpChar > 0 ? firstRegexpChar : undefined);
			// remove +?*
			key = key.replace(/[\+\*\?]+/g, '');

			// this is to allow page js to keep the custom characters as it is
			// we need to encode 2 times otherwise "/" char does not work properly
			// So, in that case, when I includes "/" it will think it's a part of the
			// route. encoding 2times fixes it
			if (params[key]) {
				return this._encodeParam(`${params[key]}`);
			}

			return '';
		});

		// Replace multiple slashes with single slash
		path = path.replace(/\/\/+/g, '/');

		// remove trailing slash
		// but keep the root slash if it's the only one
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
		const path = this.path(pathDef);
		if (!reload && path === this._current?.path) return;

		try {
			page.show(path);
		} catch (e) {
			Meteor._debug('Malformed URI!', path, e);
		}
	}

	get current() {
		return this._current;
	}

	initialize() {
		if (this._initialized) {
			throw new Error('FlowRouter is already initialized');
		}

		this._updateCallbacks();

		// Implementing idempotent routing
		// by overriding page.js`s "show" method.
		// Why?
		// It is impossible to bypass exit triggers,
		// because they execute before the handler and
		// can not know what the next path is, inside exit trigger.
		//
		// we need override both show, replace to make this work
		// since we use redirect when we are talking about withReplaceState
		page.show = ((original) => (path) => {
			if (!path || (!this.env.reload.get() && this._current?.path === path)) {
				return undefined as unknown as Context;
			}
			const pathParts = path.split('?');
			pathParts[0] = pathParts[0].replace(/\/\/+/g, '/');
			return original.call(this, pathParts.join('?'));
		})(page.show);

		page.replace = ((original) => (path, state?, dispatch?, push?) => {
			if (!path || (!this.env.reload.get() && this._current?.path === path)) {
				return undefined as unknown as Context;
			}
			const pathParts = path.split('?');
			pathParts[0] = pathParts[0].replace(/\/\/+/g, '/');
			return original.call(this, pathParts.join('?'), state, dispatch, push);
		})(page.replace);

		// this is very ugly part of pagejs and it does decoding few times
		// in unpredicatable manner. See #168
		// this is the default behaviour and we need keep it like that
		// we are doing a hack. see .path()
		page.setBase(this._basePath);

		page.start();
		this._initialized = true;
	}

	private _buildTracker() {
		// main autorun function
		const tracker = Tracker.autorun(() => {
			if (!this._current?.route) {
				return;
			}

			// see the definition of `this._processingContexts`
			const currentContext = this._current;
			const { route } = currentContext;

			if (this.safeToRun === 0) {
				throw new Error("You can't use reactive data sources like Session inside the `.subscriptions` method!");
			}

			// otherwise, computations inside action will trigger to re-run
			// this computation. which we do not need.
			Tracker.nonreactive(() => {
				let isRouteChange = currentContext.oldRoute !== currentContext.route;
				// first route is not a route change
				if (!currentContext.oldRoute) {
					isRouteChange = false;
				}

				// Clear oldRouteChain just before calling the action
				// We still need to get a copy of the oldestRoute first
				// It's very important to get the oldest route and registerRouteClose() it
				// See: https://github.com/kadirahq/flow-router/issues/314
				const oldestRoute = this._oldRouteChain[0];
				this._oldRouteChain = [];

				currentContext.route.registerRouteChange(currentContext, isRouteChange);
				route.callAction();

				Tracker.afterFlush(() => {
					this._onEveryPath.changed();
					if (isRouteChange) {
						// We need to trigger that route (definition itself) has changed.
						// So, we need to re-run all the register callbacks to current route
						// This is pretty important, otherwise tracker
						// can't identify new route's items

						// We also need to afterFlush, otherwise this will re-run
						// helpers on templates which are marked for destroying
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
		// After the invalidation we need to flush to make changes immediately
		// otherwise, we have face some issues context mix-matches and so on.
		// But there are some cases we can't flush. So we need to ready for that.

		// we clearly know, we can't flush inside an autorun
		// this may leads some issues on flow-routing
		// we may need to do some warning
		if (!Tracker.currentComputation) {
			// Still there are some cases where we can't flush
			//  eg:- when there is a flush currently
			// But we've no public API or hacks to get that state
			// So, this is the only solution
			try {
				Tracker.flush();
			} catch (ex) {
				// only handling "while flushing" errors
				if (!/Tracker\.flush while flushing/.test((ex as Error).message)) {
					return;
				}

				// XXX: fix this with a proper solution by removing subscription mgt.
				// from the router. Then we don't need to run invalidate using a tracker

				// this happens when we are trying to invoke a route change
				// with inside a route change. (eg:- Template.onCreated)
				// Since we use page.js and tracker, we don't have much control
				// over this process.
				// only solution is to defer route execution.

				// It's possible to have more than one path want to defer
				// But, we only need to pick the last one.
				// self._nextPath = self._current.path;
				Meteor.defer(() => {
					const path = this._nextPath;
					if (!path) return;

					delete this._nextPath;
					this.env.reload.withValue(true, () => {
						this.go(path, { reload: true });
					});
				});
			}
		}
	}

	_updateCallbacks() {
		page.callbacks = [];
		page.exits = [];
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
