import type { Key } from 'path-to-regexp';
import { pathToRegexp } from 'path-to-regexp';

type State = { path: string };

class Context {
	canonicalPath: string;

	path: string;

	querystring: string;

	pathname: string;

	state: State;

	title: string;

	params: Record<string, string>;

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

		if (!~this.path.indexOf('#')) return;
		const parts = this.path.split('#');
		this.path = parts[0];
		this.pathname = parts[0];
		this.querystring = this.querystring.split('#')[0];
	}

	pushState() {
		history.pushState(this.state, this.title, this.canonicalPath);
	}

	save() {
		if (location.protocol === 'file:') return;
		history.replaceState(this.state, this.title, this.canonicalPath);
	}
}

class Page {
	callbacks: Callback[] = [];

	current = '';

	private running: boolean;

	registerRoute(path: string, callback: Callback): void {
		const route = new Route(path);
		this.callbacks.push(route.middleware(callback));
	}

	start() {
		if (this.running) return;
		this.running = true;

		window.addEventListener('popstate', this.onpopstate, false);
		document.addEventListener('click', this.onclick, false);

		const url = location.pathname + location.search + location.hash;

		this.replace(url, { state: undefined, dispatch: undefined });
	}

	stop() {
		if (!this.running) return;
		this.current = '';
		this.running = false;
		document.removeEventListener('click', this.onclick, false);
		window.removeEventListener('popstate', this.onpopstate, false);
	}

	private readonly onclick = (e: MouseEvent) => {
		if (e.button !== 0) return;

		if (e.metaKey || e.ctrlKey || e.shiftKey) return;
		if (e.defaultPrevented) return;

		const el = (e.target as Element | null)?.closest<HTMLAnchorElement | SVGAElement>('a');
		if (!el) return;

		if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

		const isSVGAElement = (e: HTMLAnchorElement | SVGAElement): e is SVGAElement => typeof e.href === 'object';

		const link = isSVGAElement(el) ? el.href.baseVal : el.href;
		const url = new URL(link, location.toString());
		if (url.pathname === location.pathname && url.search === location.search && (url.hash || link === '#')) return;

		if (url.protocol === 'mailto:') return;

		if (isSVGAElement(el) ? el.target.baseVal : el.target) return;

		if (!isSVGAElement(el) && (location.protocol !== url.protocol || location.hostname !== url.hostname || location.port !== url.port))
			return;

		let path = isSVGAElement(el) ? el.href.baseVal : el.pathname + el.search + (el.hash || '');

		path = path[0] !== '/' ? `/${path}` : path;

		const orig = path;
		const pageBase = this.getBase();

		if (path.indexOf(pageBase) === 0) {
			path = path.slice(this.getBase().length);
		}

		if (pageBase && orig === path) return;

		e.preventDefault();
		page.show(orig);
	};

	private readonly onpopstate = (e: PopStateEvent) => {
		if (e.state) {
			page.replace(e.state.path, { state: e.state });
		} else {
			page.show(location.pathname + location.hash, { push: false });
		}
	};

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

	dispatch(ctx: Context) {
		let i = 0;

		const nextEnter = () => {
			const fn = this.callbacks[i++];

			if (ctx.path !== this.current) return;

			if (!fn) return this.unhandled(ctx);
			fn(ctx, nextEnter);
		};

		nextEnter();
	}

	private unhandled(ctx: Context) {
		const current = location.pathname + location.search;

		if (current === ctx.canonicalPath) return;
		this.stop();
		location.href = ctx.canonicalPath;
	}

	private base = '';

	getBase() {
		return this.base;
	}

	setBase(path: string) {
		this.base = path;
	}

	readonly Context = Context;
}

const page = new Page();

function decodeURLEncodedURIComponent(val: string): string {
	if (typeof val !== 'string') {
		return val;
	}
	return decodeURIComponent(val.replace(/\+/g, ' '));
}

class Route {
	private readonly regexp: RegExp;

	private readonly keys: Key[] = [];

	constructor(path: string) {
		this.regexp = pathToRegexp(path === '*' ? '(.*)' : path, this.keys, { strict: false });
	}

	middleware(fn: Callback): Callback {
		return (ctx, next) => {
			if (this.match(ctx.path, ctx.params)) return fn(ctx, next);
			next();
		};
	}

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

type Callback = (ctx: Context, next: () => void) => void;

export default page;

export { Context, Callback };
