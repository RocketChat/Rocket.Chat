/* eslint-disable complexity */
/* eslint-disable no-multi-assign */
/* eslint-disable @typescript-eslint/naming-convention */
import type { Key } from 'path-to-regexp';
import { pathToRegexp } from 'path-to-regexp';

type State = { path: string };

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

	/**
	 * Initialize a new "request" `Context`
	 * with the given `path` and optional initial `state`.
	 *
	 * @constructor
	 * @api public
	 */
	constructor(path: string, state?: State) {
		const pageBase = page.getBase();
		if (path[0] === '/' && path.indexOf(pageBase) !== 0) path = `${pageBase}${path}`;
		const i = path.indexOf('?');

		this.canonicalPath = path;
		this.path = path.replace(pageBase, '') || '/';

		this.title = document.title;
		this.state = { ...state, path };
		this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
		this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
		this.params = {};

		// fragment
		if (!~this.path.indexOf('#')) return;
		const parts = this.path.split('#');
		this.path = this.pathname = parts[0];
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

class Page {
	/**
	 * Callback functions.
	 */
	callbacks: Callback[] = [];

	/**
	 * Current path being processed
	 */
	current = '';

	/**
	 * Running flag.
	 */
	private running: boolean;

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
		if (this.running) return;
		this.running = true;

		window.addEventListener('popstate', this.onpopstate, false);
		document.addEventListener('click', this.onclick, false);

		const url = location.pathname + location.search + location.hash;

		this.replace(url, { state: undefined, dispatch: undefined });
	}

	/**
	 * Unbind both the popstate and click handlers.
	 */
	stop() {
		if (!this.running) return;
		this.current = '';
		this.running = false;
		document.removeEventListener('click', this.onclick, false);
		window.removeEventListener('popstate', this.onpopstate, false);
	}

	/**
	 * Handle "click" events.
	 */
	private readonly onclick = (e: MouseEvent | TouchEvent) => {
		if (this.which(e) !== 1) return;

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
		const svg =
			typeof (el as HTMLAnchorElement).href === 'object' && (el as HTMLAnchorElement).href.constructor.name === 'SVGAnimatedString';

		// Ignore if tag has
		// 1. "download" attribute
		// 2. rel="external" attribute
		if ((el as HTMLAnchorElement).hasAttribute('download') || (el as HTMLAnchorElement).getAttribute('rel') === 'external') return;

		// ensure non-hash for the same path
		const link = (el as HTMLAnchorElement).getAttribute('href');
		if (this.samePath(el as HTMLAnchorElement) && ((el as HTMLAnchorElement).hash || link === '#')) return;

		// Check for mailto: in the href
		if (link && link.indexOf('mailto:') > -1) return;

		// check target
		// svg target is an object and its desired value is in .baseVal property
		if (svg ? (el as SVGAElement).target.baseVal : (el as HTMLAnchorElement).target) return;

		// x-origin
		// note: svg links that are not relative don't call click events (and skip page.js)
		// consequently, all svg links tested inside page.js are relative and in the same origin
		if (!svg && !this.sameOrigin((el as HTMLAnchorElement).href)) return;

		// rebuild path
		// There aren't .pathname and .search properties in svg links, so we use href
		// Also, svg href is an object and its desired value is in .baseVal property
		let path = svg
			? (el as SVGAElement).href.baseVal
			: (el as HTMLAnchorElement).pathname + (el as HTMLAnchorElement).search + ((el as HTMLAnchorElement).hash || '');

		path = path[0] !== '/' ? `/${path}` : path;

		// same page
		const orig = path;
		const pageBase = this.getBase();

		if (path.indexOf(pageBase) === 0) {
			path = path.slice(this.getBase().length);
		}

		if (pageBase && orig === path) return;

		e.preventDefault();
		page.show(orig);
	};

	/**
	 * Check if `href` is the same origin.
	 */
	private sameOrigin(href: string) {
		if (!href) return false;
		const url = new URL(href, location.toString());

		return location.protocol === url.protocol && location.hostname === url.hostname && location.port === url.port;
	}

	private samePath(url: URL | HTMLAnchorElement) {
		return url.pathname === location.pathname && url.search === location.search;
	}

	/**
	 * Handle "populate" events.
	 */
	private readonly onpopstate = (e: PopStateEvent) => {
		if (e.state) {
			page.replace(e.state.path, { state: e.state });
		} else {
			page.show(location.pathname + location.hash, { push: false });
		}
	};

	/**
	 * Event button.
	 */
	private which(e: MouseEvent | TouchEvent) {
		return e.which == null ? (e as MouseEvent).button : e.which;
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
	show(
		this: this,
		path: string,
		{ state, dispatch = true, push = true, reload = false }: { state?: State; dispatch?: boolean; push?: boolean; reload?: boolean } = {},
	) {
		if (!path || (!reload && this.current === path)) return;

		const pathParts = path.split('?');
		pathParts[0] = pathParts[0].replace(/\/\/+/g, '/');
		path = pathParts.join('?');

		const ctx = new Context(path, state);
		this.current = ctx.path;
		if (dispatch) this.dispatch(ctx);
		if (push) ctx.pushState();
	}

	/**
	 * Replace `path` with optional `state` object.
	 *
	 */
	replace(this: this, path: string, { state, dispatch = true }: { state?: State; dispatch?: boolean } = {}) {
		if (!path || this.current === path) return;

		const pathParts = path.split('?');
		pathParts[0] = pathParts[0].replace(/\/\/+/g, '/');
		path = pathParts.join('?');

		const ctx = new Context(path, state);
		this.current = ctx.path;
		ctx.save(); // save before dispatching, which may redirect
		if (dispatch) this.dispatch(ctx);
	}

	/**
	 * Dispatch the given `ctx`.
	 *
	 * @api private
	 */
	dispatch(ctx: Context) {
		let i = 0;

		const nextEnter = () => {
			const fn = this.callbacks[i++];

			if (ctx.path !== this.current) {
				return;
			}
			if (!fn) return this.unhandled(ctx);
			fn(ctx, nextEnter);
		};

		nextEnter();
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

	private base = '';

	/**
	 * Gets the `base`, which depends on whether we are using History or hashbang routing.
	 */
	getBase() {
		return this.base;
	}

	/**
	 * Set the base path. For example if page.js is operating within /blog/* set the base path to "/blog".
	 */
	setBase(path: string) {
		this.base = path;
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

interface Callback {
	(ctx: Context, next: () => unknown): unknown;
}

export default page;

export { Context, Callback };
