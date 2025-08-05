/* eslint-disable complexity */
/* eslint-disable no-multi-assign */
/* eslint-disable @typescript-eslint/naming-convention */
import type { Key } from 'path-to-regexp';
import { pathToRegexp } from 'path-to-regexp';

type State = { path: string };

/**
 * Detect click event
 */
const clickEvent = document.ontouchstart ? 'touchstart' : 'click';

/**
 * Base path.
 */
let base = '';

/**
 * Running flag.
 */
let running: boolean;

/**
 * Previous context, for capturing
 * page exit events.
 */
let prevContext: Context | undefined;

class Page {
	/**
	 * Callback functions.
	 */
	callbacks: Callback[] = [];

	exits: Callback[] = [];

	/**
	 * Current path being processed
	 */
	current = '';

	registerRoute(path: string, callback: Callback): void {
		const route = new Route(path);
		this.callbacks.push(route.middleware(callback));
	}

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
	start() {
		if (running) return;
		running = true;

		window.addEventListener('popstate', onpopstate, false);
		document.addEventListener(clickEvent, onclick, false);

		const url = location.pathname + location.search + location.hash;

		this.replace(url, undefined, true);
	}

	/**
	 * Unbind both the popstate and click handlers.
	 */
	stop() {
		if (!running) return;
		this.current = '';
		running = false;
		document.removeEventListener(clickEvent, onclick, false);
		window.removeEventListener('popstate', onpopstate, false);
	}

	/**
	 * Set the base path. For example if page.js is operating within /blog/* set the base path to "/blog".
	 */
	setBase(path: string) {
		base = path;
	}

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
	show(path: string, state?: State, dispatch = true, push = true) {
		const ctx = new Context(path, state);
		const prev = prevContext;
		prevContext = ctx;
		this.current = ctx.path;
		if (dispatch) this.dispatch(ctx, prev);
		if (push) ctx.pushState();
		return ctx;
	}

	/**
	 * Replace `path` with optional `state` object.
	 *
	 */
	replace(path: string, state?: State, init?: boolean, dispatch = true): Context {
		const ctx = new Context(path, state);
		const prev = prevContext;
		prevContext = ctx;
		this.current = ctx.path;
		ctx.init = init;
		ctx.save(); // save before dispatching, which may redirect
		if (dispatch) this.dispatch(ctx, prev);
		return ctx;
	}

	/**
	 * Dispatch the given `ctx`.
	 *
	 * @api private
	 */
	dispatch(ctx: Context, prev?: Context) {
		let i = 0;
		let j = 0;

		const nextExit = () => {
			const fn = this.exits[j++];
			if (!fn) return nextEnter();
			fn(prev!, nextExit);
		};

		const nextEnter = () => {
			const fn = this.callbacks[i++];

			if (ctx.path !== this.current) {
				return;
			}
			if (!fn) return this.unhandled(ctx);
			fn(ctx, nextEnter);
		};

		if (prev) {
			nextExit();
		} else {
			nextEnter();
		}
	}

	/**
	 * Unhandled `ctx`. When it's not the initial
	 * popstate then redirect. If you wish to handle
	 * 404s on your own use `page('*', callback)`.
	 *
	 * @api private
	 */
	private unhandled(ctx: Context) {
		const current = location.pathname + location.search;

		if (current === ctx.canonicalPath) return;
		stop();
		location.href = ctx.canonicalPath;
	}

	readonly Context = Context;
}

const page = new Page();

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
	return decodeURIComponent(val.replace(/\+/g, ' '));
}

/**
 * Routes are passed Context objects, these may be used to share state, for example ctx.user =, as well as the history "state" ctx.state that the pushState API provides.
 */
class Context {
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
	state: State;

	/**
	 * The pushState title.
	 */
	title: string;

	/**
	 * The parameters from the url, e.g. /user/:id => Context.params.id
	 */
	params: Record<string, string>;

	init: boolean | undefined;

	hash: string;

	/**
	 * Initialize a new "request" `Context`
	 * with the given `path` and optional initial `state`.
	 *
	 * @constructor
	 * @api public
	 */
	constructor(path: string, state?: State) {
		const pageBase = getBase();
		if (path[0] === '/' && path.indexOf(pageBase) !== 0) path = `${pageBase}${path}`;
		const i = path.indexOf('?');

		this.canonicalPath = path;
		this.path = path.replace(pageBase, '') || '/';

		this.title = document.title;
		this.state = Object.assign(state || {}, { path });
		this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
		this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
		this.params = {};

		// fragment
		this.hash = '';
		if (!~this.path.indexOf('#')) return;
		const parts = this.path.split('#');
		this.path = this.pathname = parts[0];
		this.hash = decodeURLEncodedURIComponent(parts[1]) || '';
		this.querystring = this.querystring.split('#')[0];
	}

	/**
	 * Push state.
	 *
	 * @api private
	 */
	pushState() {
		history.pushState(this.state, this.title, this.canonicalPath);
	}

	/**
	 * Save the context state.
	 *
	 * @api public
	 */
	save() {
		if (location.protocol !== 'file:') {
			history.replaceState(this.state, this.title, this.canonicalPath);
		}
	}
}

class Route {
	private readonly regexp: RegExp;

	private readonly keys: Key[] = [];

	/**
	 * Initialize `Route` with the given HTTP `path` & `options`
	 * @param path    path
	 * @param options Options
	 */
	constructor(path: string) {
		this.regexp = pathToRegexp(path === '*' ? '(.*)' : path, this.keys, { strict: false });
	}

	/**
	 * Return route middleware with the given callback `fn()`.
	 */
	middleware(fn: Callback): Callback {
		return (ctx, next) => {
			if (this.match(ctx.path, ctx.params)) return fn(ctx, next);
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
 * Handle "populate" events.
 */
const onpopstate = (function () {
	let loaded = false;

	if (document.readyState === 'complete') {
		loaded = true;
	} else {
		window.addEventListener('load', () => {
			setTimeout(() => {
				loaded = true;
			}, 0);
		});
	}
	return function onpopstate(e: PopStateEvent) {
		if (!loaded) return;
		if (e.state) {
			const { path } = e.state;
			page.replace(path, e.state);
		} else {
			page.show(location.pathname + location.hash, undefined, undefined, false);
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
	if (samePath(el as HTMLAnchorElement) && ((el as HTMLAnchorElement).hash || link === '#')) return;

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

	// same page
	const orig = path;
	const pageBase = getBase();

	if (path.indexOf(pageBase) === 0) {
		path = path.substr(base.length);
	}

	if (pageBase && orig === path) return;

	e.preventDefault();
	page.show(orig);
}

/**
 * Event button.
 */
function which(e: MouseEvent | TouchEvent) {
	e = e || window.event;
	return e.which == null ? (e as MouseEvent).button : e.which;
}

/**
 * Convert to a URL object
 */
function toURL(href: string) {
	return new URL(href, location.toString());
}

/**
 * Check if `href` is the same origin.
 */
function sameOrigin(href: string) {
	if (!href) return false;
	const url = toURL(href);

	return location.protocol === url.protocol && location.hostname === url.hostname && location.port === url.port;
}

function samePath(url: URL | HTMLAnchorElement) {
	return url.pathname === location.pathname && url.search === location.search;
}

/**
 * Gets the `base`, which depends on whether we are using History or
 * hashbang routing.
 */
function getBase() {
	return base;
}

interface Callback {
	(ctx: Context, next: () => unknown): unknown;
}

export default page;

export { Context, Callback };
