/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable no-multi-assign */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/naming-convention */
import { pathToRegexp } from 'path-to-regexp';

/*
 * Short-cuts for global-object checks
 */
const hasDocument = typeof document !== 'undefined';
const hasWindow = typeof window !== 'undefined';
const hasHistory = typeof history !== 'undefined';
const hasProcess = typeof process !== 'undefined';

/**
 * Detect click event
 */
const clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

const isLocation = hasWindow && !!window.location;

/**
 * Perform initial dispatch.
 */
let dispatch = true;

/**
 * Decode URL components (query string, pathname, hash).
 * Accommodates both regular percent encoding and x-www-form-urlencoded format.
 */
let decodeURLComponents = true;

/**
 * Base path.
 */
let base = '';

/**
 * Strict path matching.
 */
let strict = false;

/**
 * Running flag.
 */
let running: boolean;

/**
 * HashBang option
 */
let hashbang = false;

/**
 * Previous context, for capturing
 * page exit events.
 */
let prevContext: Context | undefined;

/**
 * The window for which this `page` is running
 */
let pageWindow: Window | undefined;

interface Options {
	/**
	 * bind to click events (default = true)
	 */
	click: boolean;
	/**
	 * bind to popstate (default = true)
	 */
	popstate: boolean;
	/**
	 * perform initial dispatch (default = true)
	 */
	dispatch: boolean;
	/**
	 * add #!before urls (default = false)
	 */
	hashbang: boolean;
	/**
	 * remove URL encoding frfrom path components
	 */
	decodeURLComponents: boolean;
	/**
	 * provide a window to control (by default it will control the main window)
	 */
	window: Window;
}

/**
 *  Defines a route mapping path to the given callback(s).
 *
 *      page('/', user.list)
 *      page('/user/:id', user.load, user.show)
 *      page('/user/:id/edit', user.load, user.edit)
 *      page('*', notfound)
 *
 *  Links that are not of the same origin are disregarded and will not be dispatched.
 */
function page(path: string, ...callbacks: Callback[]): void;
/**
 * This is equivalent to page('*', callback) for generic "middleware".
 */
function page(callback: Callback): void;
/**
 *  Navigate to the given path.
 *
 *      $('.view').click(function(e){
 *        page('/user/12')
 *        e.preventDefault()
 *      })
 */
function page(path: string): void;
/**
 * Setup redirect form one path to other.
 */
function page(fromPath: string, toPath: string): void;
/**
 * Register page's popstate / click bindings. If you're doing selective binding you'll like want to pass { click: false } to specify this yourself. The following options are available:
 *
 *     - click bind to click events [true]
 *     - popstate bind to popstate[true]
 *     - dispatch perform initial dispatch[true]
 *     - hashbang add #!before urls[false]
 *
 * If you wish to load serve initial content from the server you likely will want to set dispatch to false.
 */
function page(options: Partial<Options>): void;
/**
 * Register page's popstate / click bindings. If you're doing selective binding you'll like want to pass { click: false } to specify this yourself. The following options are available:
 *
 *     - click bind to click events [true]
 *     - popstate bind to popstate[true]
 *     - dispatch perform initial dispatch[true]
 *     - hashbang add #!before urls[false]
 *
 * If you wish to load serve initial content from the server you likely will want to set dispatch to false.
 */
function page(): void;

function page(path?: string | Callback | Partial<Options>, fn?: string | Callback, ...args: Callback[]) {
	// <callback>
	if (typeof path === 'function') {
		return page('*', path);
	}

	// route <path> to <callback ...>
	if (typeof fn === 'function') {
		const route = new Route(path as string);
		page.callbacks.push(route.middleware(fn));
		for (const arg of args) {
			page.callbacks.push(route.middleware(arg));
		}
		// show <path> with [state]
	} else if (typeof path === 'string') {
		page[typeof fn === 'string' ? 'redirect' : 'show'](path, fn);
		// start [options]
	} else {
		page.start(path);
	}
}

namespace page {
	/**
	 * Callback functions.
	 */
	// eslint-disable-next-line prefer-const
	export let callbacks: Callback[] = [];

	// eslint-disable-next-line prefer-const
	export let exits: Callback[] = [];

	/**
	 * Current path being processed\
	 */
	// eslint-disable-next-line prefer-const
	export let current = '';

	/**
	 * Number of pages navigated to.
	 *
	 *     page.len == 0;
	 *     page('/login');
	 *     page.len == 1;
	 */
	// eslint-disable-next-line prefer-const
	export let len = 0;
}

/**
 * Get or set the base path. For example if page.js is operating within /blog/* set the base path to "/blog".
 */
page.base = function (path?: string) {
	if (path === undefined) return base;
	base = path;
} as {
	(): string;
	(path: string): void;
};

/**
 * Get or set strict path matching to `enable`
 *
 * @api public
 */
page.strict = function (enable?: boolean) {
	if (enable === undefined) return strict;
	strict = enable;
} as {
	(): boolean;
	(enable: boolean): void;
};

/**
 * Register page's popstate / click bindings. If you're doing selective binding you'll like want to pass { click: false } to specify this yourself. The following options are available:
 *
 *     - click bind to click events [true]
 *     - popstate bind to popstate[true]
 *     - dispatch perform initial dispatch[true]
 *     - hashbang add #!before urls[false]
 *
 * If you wish to load serve initial content from the server you likely will want to set dispatch to false.
 */
page.start = function (options: Partial<Options> = {}) {
	if (running) return;
	running = true;
	pageWindow = options.window || (hasWindow ? window : undefined);
	if (options.dispatch === false) dispatch = false;
	if (options.decodeURLComponents === false) decodeURLComponents = false;
	if (options.popstate !== false && hasWindow) pageWindow!.addEventListener('popstate', onpopstate!, false);
	if (options.click !== false && hasDocument) {
		pageWindow!.document.addEventListener(clickEvent, onclick, false);
	}
	hashbang = !!options.hashbang;
	if (hashbang && hasWindow && !hasHistory) {
		pageWindow!.addEventListener('hashchange', onpopstate!, false);
	}
	if (!dispatch) return;

	let url;
	if (isLocation) {
		const loc = pageWindow!.location;

		if (hashbang && ~loc.hash.indexOf('#!')) {
			url = loc.hash.substr(2) + loc.search;
		} else if (hashbang) {
			url = loc.search + loc.hash;
		} else {
			url = loc.pathname + loc.search + loc.hash;
		}
	}

	page.replace(url!, null, true, dispatch);
};

/**
 * Unbind both the popstate and click handlers.
 */
page.stop = function () {
	if (!running) return;
	page.current = '';
	page.len = 0;
	running = false;
	hasDocument && pageWindow!.document.removeEventListener(clickEvent, onclick, false);
	hasWindow && pageWindow!.removeEventListener('popstate', onpopstate!, false);
	hasWindow && pageWindow!.removeEventListener('hashchange', onpopstate!, false);
};

/**
 *  Navigate to the given path.
 *
 *      $('.view').click(function(e){
 *        page('/user/12')
 *        e.preventDefault()
 *      })
 *
 * Identical to page(path).
 */
page.show = function (path: string, state?: any, dispatch?: boolean, push?: boolean) {
	const ctx = new Context(path, state);
	const prev = prevContext;
	prevContext = ctx;
	page.current = ctx.path;
	if (dispatch !== false) page.dispatch(ctx, prev);
	if (ctx.handled !== false && push !== false) ctx.pushState();
	return ctx;
};

/**
 * Goes back in the history
 * Back should always let the current route push state and then go back.
 *
 * @param path - fallback path to go back if no more history exists, if undefined defaults to page.base
 * @api public
 */
page.back = function (path: string, state?: any) {
	if (page.len > 0) {
		// this may need more testing to see if all browsers
		// wait for the next tick to go back in history
		hasHistory && pageWindow!.history.back();
		page.len--;
	} else if (path) {
		setTimeout(() => {
			page.show(path, state);
		});
	} else {
		setTimeout(() => {
			page.show(getBase(), state);
		});
	}
};

page.redirect = function (from, to) {
	// Define route from a path to another
	if (typeof from === 'string' && typeof to === 'string') {
		page(from, (_e) => {
			setTimeout(() => {
				page.replace(to);
			}, 0);
		});
	}

	// Wait for the push state and replace it with another
	if (typeof from === 'string' && typeof to === 'undefined') {
		setTimeout(() => {
			page.replace(from);
		}, 0);
	}
} as {
	/**
	 * Identical to page(fromPath, toPath)
	 */
	(fromPath: string, toPath: string): void;
	/**
	 *  Calling page.redirect with only a string as the first parameter redirects to another route. Waits for the current route to push state and after replaces it with the new one leaving the browser history clean.
	 *
	 *      page('/default', function(){
	 *        // some logic to decide which route to redirect to
	 *        if(admin) {
	 *          page.redirect('/admin');
	 *        } else {
	 *          page.redirect('/guest');
	 *        }
	 *      });
	 *
	 *      page('/default');
	 *
	 */
	(page: string): void;
};

/**
 * Replace `path` with optional `state` object.
 *
 */
page.replace = function (path: string, state?: any, init?: boolean, dispatch?: boolean): Context {
	const ctx = new Context(path, state);
	const prev = prevContext;
	prevContext = ctx;
	page.current = ctx.path;
	ctx.init = init;
	ctx.save(); // save before dispatching, which may redirect
	if (dispatch !== false) page.dispatch(ctx, prev);
	return ctx;
};

/**
 * Dispatch the given `ctx`.
 *
 * @api private
 */
page.dispatch = function (ctx: Context, prev?: Context) {
	let i = 0;
	let j = 0;

	function nextExit() {
		const fn = page.exits[j++];
		if (!fn) return nextEnter();
		fn(prev!, nextExit);
	}

	function nextEnter() {
		const fn = page.callbacks[i++];

		if (ctx.path !== page.current) {
			ctx.handled = false;
			return;
		}
		if (!fn) return unhandled(ctx);
		fn(ctx, nextEnter);
	}

	if (prev) {
		nextExit();
	} else {
		nextEnter();
	}
};

/**
 * Unhandled `ctx`. When it's not the initial
 * popstate then redirect. If you wish to handle
 * 404s on your own use `page('*', callback)`.
 *
 * @api private
 */
function unhandled(ctx: Context) {
	if (ctx.handled) return;
	let current;

	if (hashbang) {
		current = isLocation && getBase() + pageWindow!.location.hash.replace('#!', '');
	} else {
		current = isLocation && pageWindow!.location.pathname + pageWindow!.location.search;
	}

	if (current === ctx.canonicalPath) return;
	page.stop();
	ctx.handled = false;
	isLocation && (pageWindow!.location.href = ctx.canonicalPath);
}

page.exit = function (path: string | Callback, ...args: Callback[]) {
	if (typeof path === 'function') {
		return page.exit('*', path);
	}

	const route = new Route(path);
	for (const arg of args) {
		page.exits.push(route.middleware(arg));
	}
} as {
	/**
	 * Defines an exit route mapping path to the given callback(s).
	 *
	 * Exit routes are called when a page changes, using the context from the previous change. For example:
	 *
	 *     page('/sidebar', function(ctx, next) {
	 *       sidebar.open = true
	 *       next()
	 *     })
	 *
	 *     page.exit('/sidebar', function(next) {
	 *       sidebar.open = false
	 *       next()
	 *     })
	 */
	(path: string, ...callbacks: Callback[]): void;
	/**
	 * Equivalent to page.exit('*', callback).
	 */
	(callback: Callback): void;
};

/**
 * Remove URL encoding from the given `str`.
 * Accommodates whitespace in both x-www-form-urlencoded
 * and regular percent-encoded form.
 *
 * @param val - URL component to decode
 */
function decodeURLEncodedURIComponent(val: string): string {
	if (typeof val !== 'string') {
		return val;
	}
	return decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
}

/**
 * Routes are passed Context objects, these may be used to share state, for example ctx.user =, as well as the history "state" ctx.state that the pushState API provides.
 */
class Context {
	/**
	 *  If true, marks the context as handled to prevent default 404 behaviour. For example this is useful for the routes with interminate quantity of the callbacks.
	 */
	handled: boolean;

	/**
	 *  Pathname including the "base" (if any) and query string "/admin/login?foo=bar".
	 */
	canonicalPath: string;

	/**
	 *  Pathname and query string "/login?foo=bar".
	 */
	path: string;

	/**
	 *  Query string void of leading ? such as "foo=bar", defaults to "".
	 */
	querystring: string;

	/**
	 *  The pathname void of query string "/login".
	 */
	pathname: string;

	/**
	 *  The pushState state object.
	 */
	state: any;

	/**
	 * The pushState title.
	 */
	title: string | undefined;

	/**
	 * The parameters from the url, e.g. /user/:id => Context.params.id
	 */
	params: any;

	init: boolean | undefined;

	hash: string;

	/**
	 * Initialize a new "request" `Context`
	 * with the given `path` and optional initial `state`.
	 *
	 * @constructor
	 * @api public
	 */
	constructor(path: string, state?: any) {
		const pageBase = getBase();
		if (path[0] === '/' && path.indexOf(pageBase) !== 0) path = pageBase + (hashbang ? '#!' : '') + path;
		const i = path.indexOf('?');

		this.canonicalPath = path;
		this.path = path.replace(pageBase, '') || '/';
		if (hashbang) this.path = this.path.replace('#!', '') || '/';

		this.title = hasDocument ? pageWindow!.document.title : undefined;
		this.state = state || {};
		this.state.path = path;
		this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
		this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
		this.params = {};

		// fragment
		this.hash = '';
		if (!hashbang) {
			if (!~this.path.indexOf('#')) return;
			const parts = this.path.split('#');
			this.path = this.pathname = parts[0];
			this.hash = decodeURLEncodedURIComponent(parts[1]) || '';
			this.querystring = this.querystring.split('#')[0];
		}
	}

	/**
	 * Push state.
	 *
	 * @api private
	 */
	pushState() {
		page.len++;
		if (hasHistory) {
			pageWindow!.history.pushState(this.state, this.title!, hashbang && this.path !== '/' ? `#!${this.path}` : this.canonicalPath);
		}
	}

	/**
	 * Save the context state.
	 *
	 * @api public
	 */
	save() {
		if (hasHistory && pageWindow!.location.protocol !== 'file:') {
			pageWindow!.history.replaceState(this.state, this.title!, hashbang && this.path !== '/' ? `#!${this.path}` : this.canonicalPath);
		}
	}
}

interface RouteOptions {
	/**
	 * enable case-sensitive routes
	 */
	sensitive?: boolean;
	/**
	 * enable strict matching for trailing slashes
	 */
	strict?: boolean;
}

class Route {
	path: string;

	method: string;

	regexp: RegExp;

	keys: Array<{ name: string; optional: boolean; offset: number }>;

	/**
	 * Initialize `Route` with the given HTTP `path` & `options`
	 * @param path    path
	 * @param options Options
	 */
	constructor(path: string, options?: RouteOptions) {
		options = options || {};
		options.strict = options.strict || strict;
		this.path = path === '*' ? '(.*)' : path;
		this.method = 'GET';
		this.regexp = pathToRegexp(this.path, (this.keys = []), options);
	}

	/**
	 * Return route middleware with the given callback `fn()`.
	 */
	middleware(fn: Callback): Callback {
		const self = this;
		return function (ctx, next) {
			if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
			next();
		};
	}

	/**
	 * Check if this route matches `path`, if so populate `params`.
	 * @param  path   path
	 * @param  params params
	 * @return true if matched, false otherwise
	 */
	match(path: string, params: Record<string, string>): boolean {
		const { keys } = this;
		const qsIndex = path.indexOf('?');
		const pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
		const m = this.regexp.exec(decodeURIComponent(pathname));

		if (!m) return false;

		for (let i = 1, len = m.length; i < len; ++i) {
			const key = keys[i - 1];
			const val = decodeURLEncodedURIComponent(m[i]);
			if (val !== undefined || !Object.prototype.hasOwnProperty.call(params, key.name)) {
				params[key.name] = val;
			}
		}

		return true;
	}
}

/**
 * Expose `Context`.
 */
page.Context = Context;

/**
 * Expose `Route`.
 */
page.Route = Route;

/**
 * Handle "populate" events.
 */
const onpopstate = (function () {
	let loaded = false;
	if (!hasWindow) return;
	if (hasDocument && document.readyState === 'complete') {
		loaded = true;
	} else {
		window.addEventListener('load', () => {
			setTimeout(() => {
				loaded = true;
			}, 0);
		});
	}
	return function onpopstate(e: PopStateEvent | HashChangeEvent) {
		if (!loaded) return;
		if ((e as PopStateEvent).state) {
			const { path } = (e as PopStateEvent).state;
			page.replace(path, (e as PopStateEvent).state);
		} else if (isLocation) {
			const loc = pageWindow!.location;
			page.show(loc.pathname + loc.hash, undefined, undefined, false);
		}
	};
})();

/**
 * Handle "click" events.
 */
function onclick(e: MouseEvent | TouchEvent) {
	if (which(e) !== 1) return;

	if (e.metaKey || e.ctrlKey || e.shiftKey) return;
	if (e.defaultPrevented) return;

	// ensure link
	// use shadow dom when available if not, fall back to composedPath() for browsers that only have shady
	let el = e.target as Node | null;
	const eventPath = e.composedPath() as EventTarget[];

	if (eventPath) {
		for (let i = 0; i < eventPath.length; i++) {
			if (!(eventPath[i] as Node).nodeName) continue;
			if ((eventPath[i] as Node).nodeName.toUpperCase() !== 'A') continue;
			if (!(eventPath[i] as HTMLAnchorElement).href) continue;

			el = eventPath[i] as Node;
			break;
		}
	}
	// continue ensure link
	// el.nodeName for svg links are 'a' instead of 'A'
	while (el && el.nodeName.toUpperCase() !== 'A') el = el.parentNode;
	if (!el || el.nodeName.toUpperCase() !== 'A') return;

	// check if link is inside an svg
	// in this case, both href and target are always inside an object
	const svg = typeof (el as HTMLAnchorElement).href === 'object' && (el as HTMLAnchorElement).href.constructor.name === 'SVGAnimatedString';

	// Ignore if tag has
	// 1. "download" attribute
	// 2. rel="external" attribute
	if ((el as HTMLAnchorElement).hasAttribute('download') || (el as HTMLAnchorElement).getAttribute('rel') === 'external') return;

	// ensure non-hash for the same path
	const link = (el as HTMLAnchorElement).getAttribute('href');
	if (!hashbang && samePath(el as HTMLAnchorElement) && ((el as HTMLAnchorElement).hash || link === '#')) return;

	// Check for mailto: in the href
	if (link && link.indexOf('mailto:') > -1) return;

	// check target
	// svg target is an object and its desired value is in .baseVal property
	if (svg ? (el as SVGAElement).target.baseVal : (el as HTMLAnchorElement).target) return;

	// x-origin
	// note: svg links that are not relative don't call click events (and skip page.js)
	// consequently, all svg links tested inside page.js are relative and in the same origin
	if (!svg && !sameOrigin((el as HTMLAnchorElement).href)) return;

	// rebuild path
	// There aren't .pathname and .search properties in svg links, so we use href
	// Also, svg href is an object and its desired value is in .baseVal property
	let path = svg
		? (el as SVGAElement).href.baseVal
		: (el as HTMLAnchorElement).pathname + (el as HTMLAnchorElement).search + ((el as HTMLAnchorElement).hash || '');

	path = path[0] !== '/' ? `/${path}` : path;

	// strip leading "/[drive letter]:" on NW.js on Windows
	if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
		path = path.replace(/^\/[a-zA-Z]:\//, '/');
	}

	// same page
	const orig = path;
	const pageBase = getBase();

	if (path.indexOf(pageBase) === 0) {
		path = path.substr(base.length);
	}

	if (hashbang) path = path.replace('#!', '');

	if (pageBase && orig === path) return;

	e.preventDefault();
	page.show(orig);
}

/**
 * Event button.
 */
function which(e: MouseEvent | TouchEvent) {
	e = e || (hasWindow && window.event);
	return e.which == null ? (e as MouseEvent).button : e.which;
}

/**
 * Convert to a URL object
 */
function toURL(href: string) {
	if (typeof URL === 'function' && isLocation) {
		return new URL(href, location.toString());
	}
	if (hasDocument) {
		const anc = document.createElement('a');
		anc.href = href;
		return anc;
	}
}

/**
 * Check if `href` is the same origin.
 */
function sameOrigin(href: string) {
	if (!href || !isLocation) return false;
	const url = toURL(href);

	const loc = pageWindow!.location;
	return loc.protocol === url!.protocol && loc.hostname === url!.hostname && loc.port === url!.port;
}

function samePath(url: URL | HTMLAnchorElement) {
	if (!isLocation) return false;
	const loc = pageWindow!.location;
	return url.pathname === loc.pathname && url.search === loc.search;
}

/**
 * Gets the `base`, which depends on whether we are using History or
 * hashbang routing.
 */
function getBase() {
	if (base) return base;
	const loc = hasWindow && pageWindow && pageWindow.location;
	return hasWindow && hashbang && loc && loc.protocol === 'file:' ? loc.pathname : base;
}

page.sameOrigin = sameOrigin;

interface Callback {
	(ctx: Context, next: () => any): any;
}

export default page;

export { Context, Route, sameOrigin, Options, Callback };
